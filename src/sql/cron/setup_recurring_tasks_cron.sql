-- ======================================
-- Supabase Cron 설정: 반복 작업 자동 생성
-- ======================================

-- 1. pg_cron 확장 활성화 (Supabase Dashboard에서 실행)
-- Extensions > pg_cron > Enable

-- 2. cron 스키마에 대한 권한 부여
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 3. 기존 크론잡이 있다면 삭제 (재실행 시)
SELECT cron.unschedule('generate-daily-recurring-tasks');

-- ======================================
-- 매일 반복 작업 생성 크론잡 설정
-- ======================================

-- 매일 자정 (UTC 기준)에 실행
SELECT cron.schedule(
    'generate-daily-recurring-tasks',           -- 크론잡 이름
    '0 0 * * *',                               -- 매일 00:00 UTC
    $$
    DO $$
    DECLARE
        rule_record RECORD;
        generated_count INTEGER;
        total_generated INTEGER := 0;
        error_count INTEGER := 0;
        log_message TEXT;
    BEGIN
        -- 로그 시작
        INSERT INTO cron_logs (job_name, started_at, message)
        VALUES ('generate-daily-recurring-tasks', NOW(), 'Starting daily recurring task generation');

        -- 모든 활성 반복 규칙에 대해 작업 생성
        FOR rule_record IN
            SELECT DISTINCT rr.id as recurrence_id, rr.frequency, rr.interval, rr.weekdays_only
            FROM recurrence_rule rr
            INNER JOIN items i ON i.recurrence_id = rr.id
            WHERE rr.until IS NULL OR rr.until >= CURRENT_DATE
        LOOP
            BEGIN
                -- 향후 7일간의 반복 작업 생성
                SELECT generate_recurring_tasks_until(
                    rule_record.recurrence_id,
                    CURRENT_DATE + INTERVAL '7 days'
                ) INTO log_message;

                -- 성공한 경우 카운트 증가
                generated_count := COALESCE((log_message::JSON->>'created_count')::INTEGER, 0);
                total_generated := total_generated + generated_count;

            EXCEPTION WHEN OTHERS THEN
                error_count := error_count + 1;
                -- 에러 로그 기록
                INSERT INTO cron_logs (job_name, started_at, message, error_message)
                VALUES (
                    'generate-daily-recurring-tasks',
                    NOW(),
                    'Failed for recurrence_id: ' || rule_record.recurrence_id,
                    SQLERRM
                );
            END;
        END LOOP;

        -- 완료 로그
        INSERT INTO cron_logs (job_name, started_at, completed_at, message)
        VALUES (
            'generate-daily-recurring-tasks',
            NOW(),
            NOW(),
            'Completed: ' || total_generated || ' tasks generated, ' || error_count || ' errors'
        );

    END $$;
    $$
);

-- ======================================
-- 크론잡 로그 테이블 생성
-- ======================================

-- 크론잡 실행 로그를 위한 테이블
CREATE TABLE IF NOT EXISTS cron_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    message TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 로그 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_started_at ON cron_logs(started_at);

-- ======================================
-- 크론잡 관리 유틸리티 함수들
-- ======================================

-- 크론잡 상태 확인 함수
CREATE OR REPLACE FUNCTION check_cron_job_status(job_name_param TEXT DEFAULT 'generate-daily-recurring-tasks')
RETURNS TABLE (
    jobname TEXT,
    schedule TEXT,
    active BOOLEAN,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.jobname::TEXT,
        j.schedule::TEXT,
        j.active,
        j.last_run,
        j.next_run
    FROM cron.job j
    WHERE j.jobname = job_name_param;
END;
$$ LANGUAGE plpgsql;

-- 크론잡 로그 조회 함수 (최근 10개)
CREATE OR REPLACE FUNCTION get_recent_cron_logs(job_name_param TEXT DEFAULT 'generate-daily-recurring-tasks')
RETURNS TABLE (
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration INTERVAL,
    message TEXT,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cl.started_at,
        cl.completed_at,
        cl.completed_at - cl.started_at as duration,
        cl.message,
        cl.error_message
    FROM cron_logs cl
    WHERE cl.job_name = job_name_param
    ORDER BY cl.started_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 수동으로 크론잡 실행하는 함수 (테스트용)
CREATE OR REPLACE FUNCTION run_daily_task_generation_now()
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- 크론잡과 동일한 로직 실행
    PERFORM generate_recurring_tasks_until(
        rr.id,
        CURRENT_DATE + INTERVAL '7 days'
    )
    FROM recurrence_rule rr
    INNER JOIN items i ON i.recurrence_id = rr.id
    WHERE rr.until IS NULL OR rr.until >= CURRENT_DATE;

    result := 'Manual task generation completed at ' || NOW();

    -- 로그 기록
    INSERT INTO cron_logs (job_name, started_at, completed_at, message)
    VALUES ('manual-generation', NOW(), NOW(), result);

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- 사용법 안내
-- ======================================

/*
## 설정 방법:
1. Supabase Dashboard > Extensions > pg_cron 활성화
2. 이 파일 전체를 SQL Editor에서 실행

## 확인 방법:
SELECT * FROM check_cron_job_status();
SELECT * FROM get_recent_cron_logs();

## 수동 실행 (테스트):
SELECT run_daily_task_generation_now();

## 크론잡 중지:
SELECT cron.unschedule('generate-daily-recurring-tasks');

## 시간대 참고:
- 크론은 UTC 기준으로 실행됩니다
- 한국 시간 오전 9시 = UTC 자정 (00:00)
- 한국 자정에 실행하려면: '0 15 * * *' (UTC 15:00)
*/