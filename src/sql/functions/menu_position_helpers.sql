-- 자동 position 관리 함수들 (fractional indexing 내장)

-- 1. 간단한 fractional indexing 구현 (PostgreSQL)
CREATE OR REPLACE FUNCTION generate_position_between(
  p_before VARCHAR(50) DEFAULT NULL,
  p_after VARCHAR(50) DEFAULT NULL
)
RETURNS VARCHAR(50) AS $$
DECLARE
  result VARCHAR(50);
  before_val NUMERIC;
  after_val NUMERIC;
  mid_val NUMERIC;
BEGIN
  -- 맨 처음 추가하는 경우
  IF p_before IS NULL AND p_after IS NULL THEN
    RETURN 'n';
  END IF;

  -- 맨 앞에 추가하는 경우
  IF p_before IS NULL THEN
    -- after의 앞에 삽입
    IF p_after < 'n' THEN
      RETURN chr(ascii(p_after) - 1);
    ELSE
      RETURN 'a';
    END IF;
  END IF;

  -- 맨 뒤에 추가하는 경우
  IF p_after IS NULL THEN
    -- before의 뒤에 삽입
    IF p_before < 'z' THEN
      RETURN chr(ascii(p_before) + 1);
    ELSE
      RETURN p_before || 'n';
    END IF;
  END IF;

  -- 두 position 사이에 삽입하는 경우
  IF length(p_before) = length(p_after) AND length(p_before) = 1 THEN
    -- 단일 문자 사이의 중간값
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

-- 2. 자동 position 계산하여 메뉴 아이템 추가
CREATE OR REPLACE FUNCTION add_menu_item(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id BIGINT,
  p_after_position VARCHAR(50) DEFAULT NULL  -- 이 position 뒤에 추가 (NULL이면 맨 뒤)
)
RETURNS VARCHAR(50) AS $$
DECLARE
  new_position VARCHAR(50);
  next_position VARCHAR(50);
BEGIN
  -- 다음 position 찾기
  IF p_after_position IS NOT NULL THEN
    SELECT position INTO next_position
    FROM menu_positions
    WHERE user_id = p_user_id AND position > p_after_position
    ORDER BY position LIMIT 1;
  ELSE
    -- 맨 뒤에 추가하는 경우, 마지막 position 뒤에 추가
    SELECT position INTO p_after_position
    FROM menu_positions
    WHERE user_id = p_user_id
    ORDER BY position DESC LIMIT 1;
  END IF;

  -- 새 position 생성
  new_position := generate_position_between(p_after_position, next_position);

  -- menu_positions에 추가
  INSERT INTO menu_positions (user_id, item_type, item_id, position)
  VALUES (p_user_id, p_item_type, p_item_id, new_position)
  ON CONFLICT (item_type, item_id)
  DO UPDATE SET position = EXCLUDED.position;

  RETURN new_position;
END;
$$ LANGUAGE plpgsql;

-- 3. 메뉴 아이템 이동 (드래그 앤 드롭)
CREATE OR REPLACE FUNCTION move_menu_item(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id BIGINT,
  p_after_position VARCHAR(50) DEFAULT NULL  -- 이 position 뒤로 이동 (NULL이면 맨 뒤)
)
RETURNS VARCHAR(50) AS $$
DECLARE
  new_position VARCHAR(50);
  next_position VARCHAR(50);
BEGIN
  -- 다음 position 찾기
  IF p_after_position IS NOT NULL THEN
    SELECT position INTO next_position
    FROM menu_positions
    WHERE user_id = p_user_id
      AND position > p_after_position
      AND NOT (item_type = p_item_type AND item_id = p_item_id)  -- 자기 자신 제외
    ORDER BY position LIMIT 1;
  ELSE
    -- 맨 뒤로 이동하는 경우
    SELECT position INTO p_after_position
    FROM menu_positions
    WHERE user_id = p_user_id
      AND NOT (item_type = p_item_type AND item_id = p_item_id)  -- 자기 자신 제외
    ORDER BY position DESC LIMIT 1;
  END IF;

  -- 새 position 생성
  new_position := generate_position_between(p_after_position, next_position);

  -- position 업데이트
  UPDATE menu_positions
  SET position = new_position
  WHERE user_id = p_user_id
    AND item_type = p_item_type
    AND item_id = p_item_id;

  RETURN new_position;
END;
$$ LANGUAGE plpgsql;

-- 4. 메뉴 아이템 삭제
CREATE OR REPLACE FUNCTION remove_menu_item(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id BIGINT
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM menu_positions
  WHERE user_id = p_user_id
    AND item_type = p_item_type
    AND item_id = p_item_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 5. 메뉴 아이템 position 설정/업데이트
CREATE OR REPLACE FUNCTION set_menu_position(
  p_user_id UUID,
  p_item_type TEXT,
  p_item_id BIGINT,
  p_position VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO menu_positions (user_id, item_type, item_id, position)
  VALUES (p_user_id, p_item_type, p_item_id, p_position)
  ON CONFLICT (item_type, item_id)
  DO UPDATE SET position = EXCLUDED.position;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 3. 개선된 사용자 메뉴 조회 (position 기반)
CREATE OR REPLACE FUNCTION get_user_menus_with_positions(p_user_id UUID)
RETURNS TABLE (
  type TEXT,
  id BIGINT,
  name TEXT,
  color TEXT,
  "position" VARCHAR(50),
  parent_id BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH positioned_menus AS (
    -- 그룹 조회
    SELECT
      'group'::TEXT as menu_type,
      g.id,
      g.name::TEXT,
      NULL::TEXT as color,
      mp.position,
      NULL::BIGINT as parent_id
    FROM groups g
    INNER JOIN menu_positions mp ON (mp.item_type = 'group' AND mp.item_id = g.id)
    WHERE g.user_id = p_user_id AND mp.user_id = p_user_id

    UNION ALL

    -- 목록 조회
    SELECT
      'list'::TEXT as menu_type,
      l.id,
      l.name::TEXT,
      l.color::TEXT,
      mp.position,
      l.group_id as parent_id
    FROM lists l
    INNER JOIN menu_positions mp ON (mp.item_type = 'list' AND mp.item_id = l.id)
    WHERE l.user_id = p_user_id AND mp.user_id = p_user_id AND l.is_system = false
  )
  SELECT pm.menu_type, pm.id, pm.name, pm.color, pm.position, pm.parent_id
  FROM positioned_menus pm
  ORDER BY pm.position;
END;
$$ LANGUAGE plpgsql;