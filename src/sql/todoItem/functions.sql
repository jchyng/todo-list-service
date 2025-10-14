-- p_date가 반복 일정에 해당하는지 확인
CREATE OR REPLACE FUNCTION is_valid_recurrence_date(
    p_recurrence_id BIGINT,
    p_date DATE
) RETURNS BOOLEAN AS $$
DECLARE
    v_rule RECORD;
    v_day_of_week INTEGER;
    v_day_name day_of_week;
    v_template_date DATE;
    v_days_diff INTEGER;
BEGIN
    SELECT frequency, interval, day_of_weeks, is_active
    INTO v_rule
    FROM recurrence_rule
    WHERE id = p_recurrence_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    CASE v_rule.frequency
        WHEN 'DAILY' THEN
            IF v_rule.interval > 1 THEN
                SELECT MIN(created_at)::DATE INTO v_template_date
                FROM todo_items
                WHERE recurrence_id = p_recurrence_id AND scheduled_date IS NULL;
                
                v_days_diff := p_date - v_template_date;
                RETURN v_days_diff % v_rule.interval = 0;
            END IF;
            RETURN TRUE;

        WHEN 'WEEKLY' THEN
            v_day_of_week := EXTRACT(DOW FROM p_date);
            v_day_name := CASE v_day_of_week
                WHEN 0 THEN 'SUNDAY'::day_of_week
                WHEN 1 THEN 'MONDAY'::day_of_week
                WHEN 2 THEN 'TUESDAY'::day_of_week
                WHEN 3 THEN 'WEDNESDAY'::day_of_week
                WHEN 4 THEN 'THURSDAY'::day_of_week
                WHEN 5 THEN 'FRIDAY'::day_of_week
                WHEN 6 THEN 'SATURDAY'::day_of_week
            END;
            
            IF v_rule.day_of_weeks IS NOT NULL AND NOT (v_day_name = ANY(v_rule.day_of_weeks)) THEN
                RETURN FALSE;
            END IF;
            
            IF v_rule.interval > 1 THEN
                SELECT MIN(created_at)::DATE INTO v_template_date
                FROM todo_items
                WHERE recurrence_id = p_recurrence_id AND scheduled_date IS NULL;
                
                v_days_diff := p_date - v_template_date;
                RETURN (v_days_diff / 7)::INTEGER % v_rule.interval = 0;
            END IF;
            RETURN TRUE;

        WHEN 'MONTHLY' THEN
            SELECT EXTRACT(DAY FROM MIN(created_at))::INTEGER INTO v_template_date
            FROM todo_items
            WHERE recurrence_id = p_recurrence_id AND scheduled_date IS NULL;
            
            RETURN EXTRACT(DAY FROM p_date)::INTEGER = v_template_date;
    END CASE;
END;
$$ LANGUAGE plpgsql;


-- 오늘 날짜에 해당하는 반복 아이템 생성 함수
CREATE OR REPLACE FUNCTION generate_today_recurring_tasks()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO todo_items (
        user_id, list_id, title, description, scheduled_date, 
        due_date, recurrence_id, is_important, is_completed, position
    )
    SELECT 
        t.user_id, t.list_id, t.title, t.description, CURRENT_DATE,
        t.due_date, t.recurrence_id, t.is_important, FALSE, 'end'
    FROM todo_items t
    INNER JOIN recurrence_rule rr ON t.recurrence_id = rr.id
    WHERE t.scheduled_date IS NULL
    AND rr.is_active = TRUE
    AND is_valid_recurrence_date(t.recurrence_id, CURRENT_DATE)
    AND NOT EXISTS (
        SELECT 1 FROM todo_items t2
        WHERE t2.recurrence_id = t.recurrence_id
        AND t2.scheduled_date = CURRENT_DATE
    );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- 만료된 반복 규칙 비활성화 함수
CREATE OR REPLACE FUNCTION deactivate_expired_recurrence_rules()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE recurrence_rule rr
    SET is_active = FALSE
    WHERE rr.is_active = TRUE
    AND EXISTS (
        SELECT 1 
        FROM todo_items t
        WHERE t.recurrence_id = rr.id
        AND t.scheduled_date IS NULL
        AND (
            (rr.frequency = 'DAILY' AND CURRENT_DATE - t.created_at::DATE >= rr.interval)
            OR (rr.frequency = 'WEEKLY' AND CURRENT_DATE - t.created_at::DATE >= rr.interval * 7)
            OR (rr.frequency = 'MONTHLY' AND CURRENT_DATE - t.created_at::DATE >= rr.interval * 30)
        )
    );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;


-- todoItem에서 반복 일정 제거
/*
  반복이 설정된 todoItem이고, 반복 item 중 가장 최근에 생성된 작업이라면,
  해당 작업의 반복 설정을 제거합니다.
*/
CREATE OR REPLACE FUNCTION remove_recurrence_from_item(p_item_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_latest_id BIGINT;
BEGIN
    SELECT id, recurrence_id, scheduled_date
    INTO v_item
    FROM todo_items
    WHERE id = p_item_id;

    IF v_item.recurrence_id IS NULL THEN
        RETURN FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM recurrence_rule 
        WHERE id = v_item.recurrence_id AND is_active = TRUE
    ) THEN
        RETURN FALSE;
    END IF;

    IF v_item.scheduled_date IS NULL THEN
        UPDATE recurrence_rule
        SET is_active = FALSE
        WHERE id = v_item.recurrence_id;
        RETURN TRUE;
    END IF;

    SELECT id INTO v_latest_id
    FROM todo_items
    WHERE recurrence_id = v_item.recurrence_id
    AND scheduled_date IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_latest_id = p_item_id THEN
        UPDATE todo_items
        SET recurrence_id = NULL
        WHERE id = p_item_id;

        UPDATE recurrence_rule
        SET is_active = FALSE
        WHERE id = v_item.recurrence_id;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;