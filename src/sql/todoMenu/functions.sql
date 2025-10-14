-- 배열 기반 메뉴 위치 관리 함수들 (fractional indexing 내장)

-- 1. Fractional indexing 헬퍼 함수 (내부용)
CREATE OR REPLACE FUNCTION generate_position_between(
  p_before VARCHAR(50) DEFAULT NULL,
  p_after VARCHAR(50) DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
  result VARCHAR(50);
BEGIN
  -- 맨 처음 추가하는 경우
  IF p_before IS NULL AND p_after IS NULL THEN
    RETURN 'n';
  END IF;

  -- 맨 앞에 추가하는 경우
  IF p_before IS NULL THEN
    IF p_after < 'n' THEN
      RETURN chr(ascii(p_after) - 1);
    ELSE
      RETURN 'a';
    END IF;
  END IF;

  -- 맨 뒤에 추가하는 경우
  IF p_after IS NULL THEN
    IF p_before < 'z' THEN
      RETURN chr(ascii(p_before) + 1);
    ELSE
      RETURN p_before || 'n';
    END IF;
  END IF;

  -- 두 position 사이에 삽입하는 경우
  IF length(p_before) = length(p_after) AND length(p_before) = 1 THEN
    IF ascii(p_after) - ascii(p_before) > 1 THEN
      RETURN chr((ascii(p_before) + ascii(p_after)) / 2);
    ELSE
      RETURN p_before || 'n';
    END IF;
  END IF;

  -- 기본적으로 before 뒤에 추가
  RETURN p_before || 'n';
END;
$$ LANGUAGE plpgsql;



-- 2. 새 아이템을 배열 인덱스에 추가
CREATE OR REPLACE FUNCTION add_menu_item_at_index(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id BIGINT,
  p_index INTEGER DEFAULT NULL  -- 배열 인덱스 (NULL이면 맨 뒤)
)
RETURNS VARCHAR(50) AS $$
DECLARE
  current_positions VARCHAR(50)[];
  before_position VARCHAR(50);
  after_position VARCHAR(50);
  new_position VARCHAR(50);
  total_count INTEGER;
BEGIN
  -- 현재 사용자의 모든 메뉴 position을 순서대로 가져오기
  SELECT array_agg(position ORDER BY position), count(*)
  INTO current_positions, total_count
  FROM menu_positions
  WHERE user_id = p_user_id;

  -- 인덱스가 NULL이거나 배열 끝을 넘으면 맨 뒤에 추가
  IF p_index IS NULL OR p_index >= total_count THEN
    IF total_count > 0 THEN
      before_position := current_positions[total_count];
    END IF;
    after_position := NULL;
  ELSIF p_index <= 0 THEN
    -- 맨 앞에 추가
    before_position := NULL;
    IF total_count > 0 THEN
      after_position := current_positions[1];
    END IF;
  ELSE
    -- 중간에 삽입
    before_position := current_positions[p_index];
    IF p_index + 1 <= total_count THEN
      after_position := current_positions[p_index + 1];
    END IF;
  END IF;

  -- 새 position 생성
  new_position := generate_position_between(before_position, after_position);

  -- menu_positions에 추가
  INSERT INTO menu_positions (user_id, item_type, item_id, position)
  VALUES (p_user_id, p_item_type, p_item_id, new_position);

  RETURN new_position;
END;
$$ LANGUAGE plpgsql;



-- 3. 기존 아이템을 배열 인덱스로 이동
CREATE OR REPLACE FUNCTION move_menu_item_to_index(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id BIGINT,
  p_index INTEGER
)
RETURNS VARCHAR(50) AS $$
DECLARE
  current_positions VARCHAR(50)[];
  before_position VARCHAR(50);
  after_position VARCHAR(50);
  new_position VARCHAR(50);
  total_count INTEGER;
BEGIN
  -- 기존 아이템을 제외한 현재 메뉴 position들 가져오기
  SELECT array_agg(position ORDER BY position), count(*)
  INTO current_positions, total_count
  FROM menu_positions
  WHERE user_id = p_user_id
    AND NOT (item_type = p_item_type AND item_id = p_item_id);

  -- 인덱스가 배열 끝을 넘으면 맨 뒤로 이동
  IF p_index >= total_count THEN
    IF total_count > 0 THEN
      before_position := current_positions[total_count];
    END IF;
    after_position := NULL;
  ELSIF p_index <= 0 THEN
    -- 맨 앞으로 이동
    before_position := NULL;
    IF total_count > 0 THEN
      after_position := current_positions[1];
    END IF;
  ELSE
    -- 중간으로 이동
    before_position := current_positions[p_index];
    IF p_index + 1 <= total_count THEN
      after_position := current_positions[p_index + 1];
    END IF;
  END IF;

  -- 새 position 생성
  new_position := generate_position_between(before_position, after_position);

  -- position 업데이트
  UPDATE menu_positions
  SET position = new_position
  WHERE user_id = p_user_id
    AND item_type = p_item_type
    AND item_id = p_item_id;

  RETURN new_position;
END;
$$ LANGUAGE plpgsql;



-- 4. 사용자 메뉴 조회 (position 기반 정렬)
CREATE OR REPLACE FUNCTION get_user_menus_with_positions(p_user_id UUID)
RETURNS TABLE (
  type TEXT,
  id BIGINT,
  name TEXT,
  color TEXT,
  "position" VARCHAR(50),
  parent_id BIGINT,
  item_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH positioned_menus AS (
    -- 그룹 조회
    SELECT
      'group'::TEXT as menu_type,
      g.id,
      g.title::TEXT,
      NULL::TEXT as color,
      mp.position,
      NULL::BIGINT as parent_id,
      0::BIGINT as item_count
    FROM todo_groups g
    INNER JOIN menu_positions mp ON (mp.item_type = 'group' AND mp.item_id = g.id)
    WHERE g.user_id = p_user_id AND mp.user_id = p_user_id

    UNION ALL

    -- 목록 조회 (todo item 개수 포함)
    SELECT
      'list'::TEXT as menu_type,
      l.id,
      l.title::TEXT,
      l.color::TEXT,
      mp.position,
      l.group_id as parent_id,
      COALESCE((
        SELECT COUNT(*)
        FROM todo_items i
        WHERE i.list_id = l.id AND i.user_id = p_user_id
      ), 0)::BIGINT as item_count
    FROM todo_lists l
    INNER JOIN menu_positions mp ON (mp.item_type = 'list' AND mp.item_id = l.id)
    WHERE l.user_id = p_user_id AND mp.user_id = p_user_id AND l.is_system = false
  )
  SELECT pm.menu_type, pm.id, pm.name, pm.color, pm.position, pm.parent_id, pm.item_count
  FROM positioned_menus pm
  ORDER BY pm.position;
END;
$$ LANGUAGE plpgsql;



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
    -- 오늘 할 일: scheduled_date가 오늘인 미완료 항목
    SELECT COUNT(*)
    INTO v_today_count
    FROM todo_items
    WHERE user_id = p_user_id
      AND is_completed = FALSE
      AND scheduled_date = CURRENT_DATE;

    -- 중요: is_important가 true인 미완료 항목
    SELECT COUNT(*)
    INTO v_important_count
    FROM todo_items
    WHERE user_id = p_user_id
      AND is_completed = FALSE
      AND is_important = TRUE;

    -- 작업: '작업' 시스템 리스트의 미완료 항목
    SELECT COUNT(*)
    INTO v_tasks_count
    FROM todo_items i
    JOIN todo_lists l ON i.list_id = l.id
    WHERE i.user_id = p_user_id
      AND i.is_completed = FALSE
      AND l.title = '작업'
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
