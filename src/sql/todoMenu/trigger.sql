-- groups 삭제 시 menu_positions 정리 함수
CREATE OR REPLACE FUNCTION delete_group_position()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM menu_positions WHERE item_type = 'group' AND item_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- lists 삭제 시 menu_positions 정리 함수
CREATE OR REPLACE FUNCTION delete_list_position()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM menu_positions WHERE item_type = 'list' AND item_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;



-- todo_groups 삭제 시 menu_positions에서 자동 삭제
CREATE TRIGGER delete_group_position_trigger
    AFTER DELETE ON todo_groups
    FOR EACH ROW
    EXECUTE FUNCTION delete_group_position();

-- todo_lists 삭제 시 menu_positions에서 자동 삭제
CREATE TRIGGER delete_list_position_trigger
    AFTER DELETE ON todo_lists
    FOR EACH ROW
    EXECUTE FUNCTION delete_list_position();
