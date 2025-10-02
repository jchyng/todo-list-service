-- ======================================
-- 반복 작업 생성/관리 SQL 함수들
-- ======================================

-- 다음 반복 날짜 계산 함수
CREATE OR REPLACE FUNCTION calculate_next_recurrence_date(
    recurrence_id BIGINT,
    from_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE AS $$
DECLARE
    rule RECORD;
    next_date DATE;
    is_exception BOOLEAN;
BEGIN
    -- 반복 규칙 조회
    SELECT * INTO rule
    FROM recurrence_rule
    WHERE id = recurrence_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- 시작 날짜 설정
    next_date := from_date;

    -- 최대 100일까지 탐색 (무한 루프 방지)
    FOR i IN 1..100 LOOP
        -- 빈도에 따른 다음 날짜 계산
        CASE rule.frequency
            WHEN 'DAILY' THEN
                IF rule.weekdays_only THEN
                    -- 평일만: 다음 평일 찾기
                    next_date := next_date + rule.interval;
                    WHILE EXTRACT(DOW FROM next_date) IN (0, 6) LOOP -- 0=일요일, 6=토요일
                        next_date := next_date + 1;
                    END LOOP;
                ELSE
                    next_date := next_date + rule.interval;
                END IF;

            WHEN 'WEEKLY' THEN
                next_date := next_date + (rule.interval * 7);

            WHEN 'MONTHLY' THEN
                next_date := next_date + (rule.interval || ' month')::INTERVAL;

            WHEN 'YEARLY' THEN
                next_date := next_date + (rule.interval || ' year')::INTERVAL;

            ELSE
                RETURN NULL; -- 지원하지 않는 빈도
        END CASE;

        -- 종료 조건 확인
        IF rule.until IS NOT NULL AND next_date > rule.until::DATE THEN
            RETURN NULL;
        END IF;

        -- 예외 날짜인지 확인
        SELECT EXISTS(
            SELECT 1 FROM recurrence_exceptions
            WHERE recurrence_id = rule.id
            AND exception_date = next_date
        ) INTO is_exception;

        -- 예외가 아니면 반환
        IF NOT is_exception THEN
            RETURN next_date;
        END IF;

        -- 예외인 경우 다음 날짜로 계속 진행
    END LOOP;

    -- 100일 내에 찾지 못하면 NULL 반환
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 반복 작업의 다음 인스턴스 생성 함수
CREATE OR REPLACE FUNCTION create_next_recurring_task(
    original_item_id BIGINT
) RETURNS JSON AS $$
DECLARE
    original_item RECORD;
    next_date DATE;
    new_position VARCHAR(50);
    new_item_id BIGINT;
    result JSON;
BEGIN
    -- 원본 작업 정보 조회
    SELECT * INTO original_item
    FROM items
    WHERE id = original_item_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', '원본 작업을 찾을 수 없습니다'
        );
    END IF;

    -- 반복 규칙이 없으면 종료
    IF original_item.recurrence_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '반복 작업이 아닙니다'
        );
    END IF;

    -- 다음 반복 날짜 계산
    next_date := calculate_next_recurrence_date(
        original_item.recurrence_id,
        COALESCE(original_item.due_date, CURRENT_DATE)
    );

    -- 다음 날짜가 없으면 종료 (반복 완료)
    IF next_date IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '반복이 완료되었습니다'
        );
    END IF;

    -- 새 position 생성 (맨 아래에 추가)
    SELECT generate_position_between(
        (SELECT MAX(position) FROM items WHERE list_id = original_item.list_id),
        NULL
    ) INTO new_position;

    -- 새 반복 작업 생성
    INSERT INTO items (
        user_id,
        list_id,
        title,
        description,
        is_completed,
        is_important,
        recurrence_id,
        due_date,
        position,
        created_at,
        updated_at
    ) VALUES (
        original_item.user_id,
        original_item.list_id,
        original_item.title,
        original_item.description,
        false, -- 새 작업은 미완료 상태
        original_item.is_important,
        original_item.recurrence_id,
        next_date,
        new_position,
        NOW(),
        NOW()
    ) RETURNING id INTO new_item_id;

    -- 결과 반환
    SELECT json_build_object(
        'success', true,
        'data', json_build_object(
            'id', new_item_id,
            'due_date', next_date,
            'position', new_position
        )
    ) INTO result;

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- 완료된 반복 작업 처리 함수 (완료 시 자동으로 다음 작업 생성)
CREATE OR REPLACE FUNCTION handle_recurring_task_completion(
    item_id BIGINT
) RETURNS JSON AS $$
DECLARE
    item_record RECORD;
    result JSON;
BEGIN
    -- 작업 정보 조회
    SELECT * INTO item_record
    FROM items
    WHERE id = item_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', '작업을 찾을 수 없습니다'
        );
    END IF;

    -- 반복 작업이 아니면 종료
    IF item_record.recurrence_id IS NULL THEN
        RETURN json_build_object(
            'success', true,
            'message', '일반 작업 완료'
        );
    END IF;

    -- 다음 반복 작업 생성
    SELECT create_next_recurring_task(item_id) INTO result;

    RETURN result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- 특정 날짜까지의 반복 작업들을 일괄 생성하는 함수
CREATE OR REPLACE FUNCTION generate_recurring_tasks_until(
    recurrence_id BIGINT,
    end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
) RETURNS JSON AS $$
DECLARE
    rule RECORD;
    template_item RECORD;
    current_date DATE;
    next_date DATE;
    new_position VARCHAR(50);
    created_count INTEGER := 0;
    max_iterations INTEGER := 365; -- 최대 1년치 생성
    i INTEGER := 0;
BEGIN
    -- 반복 규칙 조회
    SELECT * INTO rule
    FROM recurrence_rule
    WHERE id = recurrence_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', '반복 규칙을 찾을 수 없습니다'
        );
    END IF;

    -- 템플릿 작업 조회 (해당 반복 규칙의 첫 번째 작업)
    SELECT * INTO template_item
    FROM items
    WHERE recurrence_id = rule.id
    ORDER BY created_at
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', '템플릿 작업을 찾을 수 없습니다'
        );
    END IF;

    -- 현재 날짜부터 시작
    current_date := COALESCE(template_item.due_date, CURRENT_DATE);

    -- 지정된 날짜까지 반복 작업 생성
    WHILE current_date <= end_date AND i < max_iterations LOOP
        i := i + 1;

        -- 다음 반복 날짜 계산
        next_date := calculate_next_recurrence_date(recurrence_id, current_date);

        EXIT WHEN next_date IS NULL OR next_date > end_date;

        -- 해당 날짜의 작업이 이미 존재하는지 확인
        IF NOT EXISTS(
            SELECT 1 FROM items
            WHERE recurrence_id = rule.id
            AND due_date = next_date
        ) THEN
            -- 새 position 생성
            SELECT generate_position_between(
                (SELECT MAX(position) FROM items WHERE list_id = template_item.list_id),
                NULL
            ) INTO new_position;

            -- 새 반복 작업 생성
            INSERT INTO items (
                user_id, list_id, title, description,
                is_completed, is_important, recurrence_id,
                due_date, position, created_at, updated_at
            ) VALUES (
                template_item.user_id, template_item.list_id,
                template_item.title, template_item.description,
                false, template_item.is_important, rule.id,
                next_date, new_position, NOW(), NOW()
            );

            created_count := created_count + 1;
        END IF;

        current_date := next_date;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'created_count', created_count,
        'end_date', end_date
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql;