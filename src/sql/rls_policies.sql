-- ======================================
-- RLS (Row Level Security) 정책 설정
-- ======================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_rule ENABLE ROW LEVEL SECURITY;

-- ======================================
-- users 정책 (사용자 프로필 관리)
-- ======================================

CREATE POLICY "Users can insert their profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view their profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their profile" ON users FOR DELETE USING (auth.uid() = id);

-- ======================================
-- todo_groups 정책 (그룹 관리)
-- ======================================

CREATE POLICY "Users can insert their groups" ON todo_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their groups" ON todo_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their groups" ON todo_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their groups" ON todo_groups FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- todo_lists 정책 (리스트 관리)
-- ======================================

CREATE POLICY "Users can insert their lists" ON todo_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their lists" ON todo_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their lists" ON todo_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their lists" ON todo_lists FOR DELETE USING (auth.uid() = user_id);

-- ======================================
-- todo_items 정책 (할 일 아이템 관리)
-- ======================================

CREATE POLICY "Users can insert items in their lists" ON todo_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view items in their lists" ON todo_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update items in their lists" ON todo_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete items in their lists" ON todo_items FOR DELETE USING (auth.uid() = user_id);

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

