-- ======================================
-- 기본 테이블 정의
-- ======================================

-- 사용자 프로필 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY,                         -- auth.users.id와 동일
    isInitialized BOOLEAN DEFAULT FALSE          -- 기본 시스템 메뉴 생성 여부
);

-- ======================================
-- 할 일 구조 테이블
-- ======================================

-- 그룹 테이블 (메뉴의 상위 카테고리)
CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리스트 테이블 (실제 할 일을 담는 컨테이너)
CREATE TABLE lists (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id BIGINT REFERENCES groups(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 메뉴 position 관리 테이블 (group과 list의 순서 통합 관리)
CREATE TABLE menu_positions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('group', 'list')),
    item_id BIGINT NOT NULL,
    position VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 제약조건: 각 아이템은 하나의 position만, 사용자별 position 중복 방지
    CONSTRAINT menu_positions_unique_item UNIQUE (item_type, item_id),
    CONSTRAINT menu_positions_unique_user_position UNIQUE (user_id, position)
);

-- ======================================
-- 반복 규칙 테이블
-- ======================================

-- 반복 일정 규칙 정의
CREATE TABLE recurrence_rule (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frequency TEXT NOT NULL CHECK (frequency IN ('DAILY','WEEKLY','MONTHLY','YEARLY','CUSTOM')),
    interval INTEGER DEFAULT 1,
    by_day VARCHAR(20),
    by_month_day VARCHAR(50),
    until TIMESTAMPTZ,
    count INTEGER,
    weekdays_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 반복 예외 처리 테이블 (특정 날짜 제외)
CREATE TABLE recurrence_exceptions (
    id BIGSERIAL PRIMARY KEY,
    recurrence_id BIGINT NOT NULL REFERENCES recurrence_rule(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    exception_type TEXT NOT NULL CHECK (exception_type IN ('deleted', 'modified', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- 제약조건: 같은 반복 규칙에서 같은 날짜 중복 방지
    CONSTRAINT recurrence_exceptions_unique_date UNIQUE (recurrence_id, exception_date)
);

-- ======================================
-- 할 일 아이템 테이블
-- ======================================

-- 개별 할 일 아이템
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    recurrence_id BIGINT REFERENCES recurrence_rule(id) ON DELETE CASCADE,
    due_date date,
    added_to_my_day_date DATE,
    position VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ======================================
-- 성능 최적화 인덱스
-- ======================================

-- 사용자별 데이터 조회 최적화
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_items_user_id ON items(user_id);

-- 계층 구조 조회 최적화
CREATE INDEX idx_lists_group_id ON lists(group_id);
CREATE INDEX idx_items_list_id ON items(list_id);

-- Position 기반 정렬 최적화
CREATE INDEX idx_items_list_id_position ON items(list_id, position);
CREATE INDEX idx_menu_positions_user_position ON menu_positions(user_id, position);
CREATE INDEX idx_menu_positions_item ON menu_positions(item_type, item_id);

-- 반복 규칙 조회 최적화
CREATE INDEX idx_recurrence_rule_user_id ON recurrence_rule(user_id);
CREATE INDEX idx_items_recurrence_id ON items(recurrence_id);

-- 반복 예외 조회 최적화
CREATE INDEX idx_recurrence_exceptions_recurrence_id ON recurrence_exceptions(recurrence_id);
CREATE INDEX idx_recurrence_exceptions_date ON recurrence_exceptions(exception_date);

-- 날짜 기반 조회 최적화
CREATE INDEX idx_items_due_date ON items(due_date);
CREATE INDEX idx_items_completed_at ON items(completed_at);
CREATE INDEX idx_items_my_day_date ON items(added_to_my_day_date) WHERE added_to_my_day_date IS NOT NULL;

-- ======================================
-- 참고사항
-- ======================================
--
-- 추가 파일들:
-- - src/sql/policies/rls_policies.sql: RLS (Row Level Security) 정책 정의
-- - src/sql/trigger/menu_position_cascade_triggers.sql: 연관 데이터 정리 트리거
-- - src/sql/functions/menu_position_helpers.sql: Position 관리 유틸리티 함수
--



