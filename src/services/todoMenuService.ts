import type { TailwindColor } from "@/constant/TailwindColor";
import { supabase } from "@/lib/supabase";

/**
 * Todo 메뉴(그룹, 리스트) 생성 관련 서비스
 */

// 통일된 서비스 응답 타입
type ServiceResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * 새로운 그룹 생성 (배열 인덱스 기반)
 * @param userId - 사용자 ID
 * @param name - 그룹 이름
 * @param index - 배열 인덱스 (선택사항, 없으면 맨 뒤)
 * @returns 생성된 그룹 데이터 또는 에러
 */
export async function createGroup(
  userId: string,
  name: string,
  index?: number
) {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      user_id: userId,
      name,
    })
    .select()
    .single();

  if (groupError) return { success: false, error: groupError.message };

  // 메뉴에 추가
  const { error: positionError } = await supabase.rpc('add_menu_item_at_index', {
    p_user_id: userId,
    p_item_type: 'group',
    p_item_id: group.id,
    p_index: index || null
  });

  if (positionError) return { success: false, error: positionError.message };

  return { success: true, data: group };
}

/**
 * 새로운 리스트 생성 (배열 인덱스 기반)
 * @param userId - 사용자 ID
 * @param name - 리스트 이름
 * @param color - 리스트 색상
 * @param groupId - 그룹 ID (선택사항)
 * @param index - 배열 인덱스 (선택사항, 없으면 맨 뒤)
 * @returns 생성된 리스트 데이터 또는 에러
 */
export async function createList(
  userId: string,
  name: string,
  color: TailwindColor | null = null,
  groupId: number | null = null,
  index?: number
) {
  const { data: list, error: listError } = await supabase
    .from("lists")
    .insert({
      user_id: userId,
      group_id: groupId,
      color,
      name,
      is_system: false,
    })
    .select()
    .single();

  if (listError) return { success: false, error: listError.message };

  // 메뉴에 추가
  const { error: positionError } = await supabase.rpc('add_menu_item_at_index', {
    p_user_id: userId,
    p_item_type: 'list',
    p_item_id: list.id,
    p_index: index || null
  });

  if (positionError) return { success: false, error: positionError.message };

  return { success: true, data: list };
}

/**
 * 시스템 리스트 생성 (메뉴에 표시되지 않음)
 * @param userId - 사용자 ID
 * @param name - 리스트 이름
 * @param color - 리스트 색상
 * @returns 생성된 시스템 리스트 데이터 또는 에러
 */
export async function createSystemList(
  userId: string,
  name: string,
  color: TailwindColor | null = null
) {
  const { data, error } = await supabase
    .from("lists")
    .insert({
      user_id: userId,
      name,
      color,
      is_system: true,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createDefaultSystemList(userId: string) {
  return createSystemList(userId, "작업");
}

/**
 * 메뉴 아이템 이동 (배열 인덱스 기반)
 * @param userId - 사용자 ID
 * @param itemType - 아이템 타입 ('group' | 'list')
 * @param itemId - 아이템 ID
 * @param newIndex - 새로운 배열 인덱스
 * @returns 이동 결과 또는 에러
 */
export async function moveMenuItem(
  userId: string,
  itemType: 'group' | 'list',
  itemId: number,
  newIndex: number
) {
  const { error } = await supabase.rpc('move_menu_item_to_index', {
    p_user_id: userId,
    p_item_type: itemType,
    p_item_id: itemId,
    p_index: newIndex
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}


/**
 * 목록 삭제 (CASCADE로 position 자동 삭제)
 * @param userId - 사용자 ID
 * @param listId - 삭제할 목록 ID
 * @returns 삭제 결과 또는 에러
 */
export async function deleteList(userId: string, listId: number) {
  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * 그룹 해제 (그룹 내 모든 목록을 독립 목록으로 변환)
 * @param userId - 사용자 ID
 * @param groupId - 해제할 그룹 ID
 * @returns 해제 결과 또는 에러
 */
export async function dissolveGroup(userId: string, groupId: number) {
  // 1. 일괄 group_id 제거 (모든 목록을 독립 목록으로 변환)
  const { data: updatedLists, error: updateError } = await supabase
    .from("lists")
    .update({ group_id: null })
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .select("id");

  if (updateError) return { success: false, error: updateError.message };

  // 2. 각 목록을 메뉴에 추가 (맨 뒤에)
  if (updatedLists && updatedLists.length > 0) {
    for (const list of updatedLists) {
      await supabase.rpc('add_menu_item_at_index', {
        p_user_id: userId,
        p_item_type: 'list',
        p_item_id: list.id,
        p_index: null
      });
    }
  }

  // 3. 그룹 삭제 (CASCADE로 position 자동 삭제)
  const { error: deleteError } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", userId);

  if (deleteError) return { success: false, error: deleteError.message };

  return { success: true, data: { updatedLists: updatedLists?.length || 0 } };
}

/**
 * 사용자의 모든 메뉴 조회 (position 기반)
 * @param userId - 사용자 ID
 * @returns 메뉴 데이터 또는 에러
 */
export async function getUserMenus(userId: string) {
  const { data, error } = await supabase.rpc('get_user_menus_with_positions', {
    p_user_id: userId
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}
