-- 반복 주기와 요일 타입 정의
CREATE TYPE recurrence_frequency AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
CREATE TYPE day_of_week AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- 반복 일정 규칙 
CREATE TABLE recurrence_rule (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 반복 규칙 소유자
  frequency recurrence_frequency NOT NULL,  -- 반복 빈도 
  interval INTEGER DEFAULT 1,               -- 반복 간격 (1=매번, N=N번)
  day_of_weeks day_of_week[],               -- WEEKLY일 때 선택된 요일 배열 (예: {MONDAY,WEDNESDAY,FRIDAY})
  is_active BOOLEAN DEFAULT TRUE,            -- 반복 활성화 여부 (FALSE면 더 이상 생성 안 함)
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 개별 할 일 아이템
CREATE TABLE todo_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_id BIGINT NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_date DATE,      -- 오늘 할 일 추가 시 적용되는 작업 진행 날짜
  due_date DATE,
  recurrence_id BIGINT REFERENCES recurrence_rule(id) ON DELETE SET NULL,
  is_important BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  position VARCHAR(50) NOT NULL,  -- 리스트 내 정렬 순서 관리
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 반복 규칙 조회 최적화
CREATE INDEX idx_recurrence_rule_active ON recurrence_rule(user_id, is_active);

-- todo_items 조회 최적화
CREATE INDEX idx_todo_items_user_id ON todo_items(user_id);              -- 사용자별 아이템 조회
CREATE INDEX idx_todo_items_list_id ON todo_items(list_id);              -- 리스트별 아이템 조회
CREATE INDEX idx_todo_items_recurrence_date ON todo_items(recurrence_id, scheduled_date);  -- 반복 일정 조회
CREATE INDEX idx_todo_items_user_date ON todo_items(user_id, scheduled_date);  -- 시스템 메뉴 (오늘, 중요) 조회


