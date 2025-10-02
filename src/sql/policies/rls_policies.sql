-- ======================================
-- RLS (Row Level Security) 정책 설정
-- ======================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_exceptions ENABLE ROW LEVEL SECURITY;

-- ======================================
-- users 정책 (사용자 프로필 관리)
-- ======================================

CREATE POLICY "Users can insert their profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their profile" ON users FOR DELETE USING (auth.uid() = id);

-- ======================================
-- groups 정책 (그룹 관리)
-- ======================================

CREATE POLICY "Users can insert their groups" ON groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their groups" ON groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their groups" ON groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their groups" ON groups FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- lists 정책 (리스트 관리)
-- ======================================

CREATE POLICY "Users can insert their lists" ON lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their lists" ON lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their lists" ON lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their lists" ON lists FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- items 정책 (할 일 아이템 관리)
-- ======================================

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

-- ======================================
-- menu_positions 정책 (메뉴 순서 관리)
-- ======================================

CREATE POLICY "Users can manage their menu positions" ON menu_positions FOR ALL USING (auth.uid() = user_id);

-- ======================================
-- recurrence_rule 정책 (반복 규칙 관리)
-- ======================================

CREATE POLICY "Users can view their recurrence rules" ON recurrence_rule FOR SELECT USING (
    auth.uid() = user_id
);
CREATE POLICY "Users can insert their recurrence rules" ON recurrence_rule FOR INSERT WITH CHECK (
    auth.uid() = user_id
);
CREATE POLICY "Users can update their recurrence rules" ON recurrence_rule FOR UPDATE USING (
    auth.uid() = user_id
);
CREATE POLICY "Users can delete their recurrence rules" ON recurrence_rule FOR DELETE USING (
    auth.uid() = user_id
);

-- ======================================
-- recurrence_exceptions 정책 (반복 예외 관리)
-- ======================================

CREATE POLICY "Users can view their recurrence exceptions" ON recurrence_exceptions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM recurrence_rule
        JOIN items ON items.recurrence_id = recurrence_rule.id
        WHERE recurrence_rule.id = recurrence_exceptions.recurrence_id
        AND items.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their recurrence exceptions" ON recurrence_exceptions FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM recurrence_rule
        JOIN items ON items.recurrence_id = recurrence_rule.id
        WHERE recurrence_rule.id = recurrence_exceptions.recurrence_id
        AND items.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their recurrence exceptions" ON recurrence_exceptions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM recurrence_rule
        JOIN items ON items.recurrence_id = recurrence_rule.id
        WHERE recurrence_rule.id = recurrence_exceptions.recurrence_id
        AND items.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their recurrence exceptions" ON recurrence_exceptions FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM recurrence_rule
        JOIN items ON items.recurrence_id = recurrence_rule.id
        WHERE recurrence_rule.id = recurrence_exceptions.recurrence_id
        AND items.user_id = auth.uid()
    )
);