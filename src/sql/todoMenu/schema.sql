-- 그룹 테이블 (메뉴의 상위 카테고리)
CREATE TABLE todo_groups (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL
);


-- 리스트 테이블 (실제 할 일을 담는 컨테이너)
CREATE TABLE todo_lists (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id BIGINT REFERENCES todo_groups(id) ON DELETE SET NULL,
  is_system BOOLEAN DEFAULT FALSE,    -- 기본적으로 '작업'이라는 이름의 시스템 메뉴가 존재함
  title VARCHAR(100) NOT NULL,
  color VARCHAR(20)                   -- 각 리스트 Identity 색상 (예: 'red', 'blue')
);


-- 메뉴 position 관리 테이블 (todoPage sidebar에 표출되는 menu(todo_groups & todo_lists)의 순서 통합 관리)
CREATE TYPE menu_item_type AS ENUM ('group', 'list');

CREATE TABLE menu_positions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id BIGINT NOT NULL,
  item_type menu_item_type NOT NULL,
  position VARCHAR(50) NOT NULL,      -- fractional indexing (ex: 'a', 'b', 'c', 'a1', 'a2', 'b1' ...)
  group_id BIGINT REFERENCES todo_groups(id) ON DELETE CASCADE,

  CONSTRAINT menu_positions_unique_item UNIQUE (item_type, item_id),
  CONSTRAINT unique_position_per_group UNIQUE (user_id, group_id, position)
);

/*
  🚨 주의사항
  1. Index 생성 ❌
    menu(group, list)의 경우 dnd와 제목, 색상 등 업데이트가 빈번하고, 변경 시 낙관적 업데이트로 DB 조회가 발생하지 않는다.
    따라서, 성능 최적화를 위해 인덱스를 생성하지 않는다.

  2. Position 중복 ❌ 
    group_id가 null인 list와 group은 메뉴에서 같은 Depth를 가지기 때문에 position이 중복될 수 없다.
    list의 position은 group 단위로 고유하게 관리되므로 group_id가 동일한 list는 position이 중복될 수 없다.

    group_id가 null인 list와 group의 position은 중복을 제한하는 제약 조건 추가는 불가능하다. 
    쓰기를 진행할 때 Trigger로 중복을 체크하는 방법 또한 성능 저하로 인해 사용하지 않는다.
    따라서, 시스템 로직에서 처리하는 것으로 결정한다.
*/


