-- ======================================
-- 시스템 메뉴 카운트 조회 함수
-- ======================================

-- 시스템 메뉴별 할 일 개수 조회
CREATE OR REPLACE FUNCTION get_system_menu_counts(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_count INTEGER;
    v_important_count INTEGER;
    v_tasks_count INTEGER;
    v_result JSON;
BEGIN
    -- 오늘 할 일: added_to_my_day_date가 오늘인 미완료 항목
    SELECT COUNT(*)
    INTO v_today_count
    FROM items
    WHERE user_id = p_user_id
      AND is_completed = FALSE
      AND added_to_my_day_date = CURRENT_DATE;

    -- 중요: is_important가 true인 미완료 항목
    SELECT COUNT(*)
    INTO v_important_count
    FROM items
    WHERE user_id = p_user_id
      AND is_completed = FALSE
      AND is_important = TRUE;

    -- 작업: '작업' 시스템 리스트의 미완료 항목
    SELECT COUNT(*)
    INTO v_tasks_count
    FROM items i
    JOIN lists l ON i.list_id = l.id
    WHERE i.user_id = p_user_id
      AND i.is_completed = FALSE
      AND l.name = '작업'
      AND l.is_system = TRUE;

    -- JSON 형태로 반환
    v_result := json_build_object(
        'today', COALESCE(v_today_count, 0),
        'important', COALESCE(v_important_count, 0),
        'tasks', COALESCE(v_tasks_count, 0)
    );

    RETURN v_result;
END;
$$;

-- 함수 사용 예시:
-- SELECT get_system_menu_counts('user-uuid-here');
-- 결과: {"today": 5, "important": 3, "tasks": 8}
