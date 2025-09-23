-- users 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY,                         -- auth.users.id와 동일
    isInitialized BOOLEAN DEFAULT FALSE          -- 기본 시스템 메뉴 생성 여부
);

-- 그룹 테이블
CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리스트 테이블
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

-- 아이템 테이블
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    position VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 메뉴 position 관리 테이블 (group과 list의 position 통합 관리)
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

-- CASCADE 관계를 위한 트리거 함수
CREATE OR REPLACE FUNCTION delete_menu_position_on_item_delete()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM menu_positions
    WHERE item_type = TG_ARGV[0] AND item_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- groups 삭제 시 menu_positions에서 자동 삭제
CREATE TRIGGER delete_group_position
    AFTER DELETE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION delete_menu_position_on_item_delete('group');

-- lists 삭제 시 menu_positions에서 자동 삭제
CREATE TRIGGER delete_list_position
    AFTER DELETE ON lists
    FOR EACH ROW
    EXECUTE FUNCTION delete_menu_position_on_item_delete('list');


-- 인덱스 생성
CREATE INDEX idx_groups_user_id ON groups(user_id);
CREATE INDEX idx_lists_user_id ON lists(user_id);
CREATE INDEX idx_lists_group_id ON lists(group_id);
CREATE INDEX idx_items_list_id_position ON items(list_id, position);
CREATE INDEX idx_menu_positions_user_position ON menu_positions(user_id, position);
CREATE INDEX idx_menu_positions_item ON menu_positions(item_type, item_id);



-- ======================================
-- RLS (Row Level Security) 정책 설정
-- ======================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_positions ENABLE ROW LEVEL SECURITY;

-- users 정책 (INSERT/SELECT/UPDATE/DELETE 분리)
CREATE POLICY "Users can insert their profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their profile" ON users FOR DELETE USING (auth.uid() = id);

-- groups 정책 (INSERT/SELECT/UPDATE/DELETE 분리)
CREATE POLICY "Users can insert their groups" ON groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their groups" ON groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their groups" ON groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their groups" ON groups FOR DELETE USING (auth.uid() = user_id);

-- lists 정책 (INSERT/SELECT/UPDATE/DELETE 분리)
CREATE POLICY "Users can insert their lists" ON lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their lists" ON lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their lists" ON lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their lists" ON lists FOR DELETE USING (auth.uid() = user_id);

-- items 정책 (INSERT/SELECT/UPDATE/DELETE 분리)
CREATE POLICY "Users can insert items in their lists" ON items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view items in their lists" ON items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM lists
        WHERE lists.id = items.list_id
        AND lists.user_id = auth.uid()
    )
);
CREATE POLICY "Users can update items in their lists" ON items FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM lists
        WHERE lists.id = items.list_id
        AND lists.user_id = auth.uid()
    )
);
CREATE POLICY "Users can delete items in their lists" ON items FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM lists
        WHERE lists.id = items.list_id
        AND lists.user_id = auth.uid()
    )
);

-- menu_positions 정책
CREATE POLICY "Users can manage their menu positions" ON menu_positions FOR ALL USING (auth.uid() = user_id);




