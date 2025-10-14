-- 매일 자정에 오늘 날짜에 해당하는 반복 일정 생성 및 만료된 반복 규칙 비활성화
SELECT cron.schedule(
    'generate-daily-recurring-tasks',
    '0 0 * * *',
    $$
    SELECT generate_today_recurring_tasks();
    SELECT deactivate_expired_recurrence_rules();
    $$
);


-- 크론 로그 확인 (Supabase)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-daily-recurring-tasks')
ORDER BY start_time DESC
LIMIT 10;