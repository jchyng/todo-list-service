-- 사용자 메뉴 조회 최적화 함수
-- 그룹과 목록을 하나의 쿼리로 조회하여 성능 향상
--
-- 주의: 타입 캐스팅 사용 이유
-- 1. DB 테이블 구조 보호: 기존 VARCHAR 타입을 그대로 유지
-- 2. 유연성 확보: 다양한 VARCHAR 길이를 TEXT로 통합
-- 3. 미래 대응: DB 스키마 변경 시에도 함수 수정 최소화
-- 4. 호환성: PostgreSQL 타입 시스템과의 호환성 보장

CREATE OR REPLACE FUNCTION get_user_menus(p_user_id UUID)
RETURNS TABLE (
  type TEXT,
  id BIGINT,
  name TEXT,
  color TEXT,
  "position" TEXT,
  parent_id BIGINT
) AS $$
BEGIN
  RETURN QUERY
  -- 1. 그룹 조회
  SELECT
    'group'::TEXT as "type",
    g.id,
    g.name::TEXT,                    -- VARCHAR → TEXT 캐스팅
    NULL::TEXT as color,
    g."position"::TEXT,              -- VARCHAR → TEXT 캐스팅
    NULL::BIGINT as parent_id
  FROM groups g
  WHERE g.user_id = p_user_id

  UNION ALL

  -- 2. 목록 조회 (시스템 메뉴 제외)
  SELECT
    'list'::TEXT as "type",
    l.id,
    l.name::TEXT,                    -- VARCHAR → TEXT 캐스팅
    l.color::TEXT,                   -- VARCHAR → TEXT 캐스팅
    l."position"::TEXT,              -- VARCHAR → TEXT 캐스팅
    l.group_id as parent_id
  FROM lists l
  WHERE l.user_id = p_user_id
    AND l.is_system = false

  ORDER BY "position";
END;
$$ LANGUAGE plpgsql;