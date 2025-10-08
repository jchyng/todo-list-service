import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";

/**
 * 그룹 생성
 */
export async function createGroup(
  userId: string,
  name: string,
  index?: number
): Promise<ServiceResult> {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      user_id: userId,
      name,
    })
    .select()
    .single();

  if (groupError) return handleServiceError(groupError);

  const { error: positionError } = await supabase.rpc(
    "add_menu_item_at_index",
    {
      p_user_id: userId,
      p_item_type: "group",
      p_item_id: group.id,
      p_index: index ?? null,
    }
  );

  if (positionError) {
    console.error("RPC add_menu_item_at_index error:", {
      error: positionError,
      params: { p_user_id: userId, p_item_type: "group", p_item_id: group.id, p_index: index ?? null }
    });
    return handleServiceError(positionError);
  }

  return { success: true, data: group };
}

/**
 * 그룹 이름 업데이트
 */
export async function updateGroupName(
  userId: string,
  groupId: number,
  name: string
): Promise<ServiceResult> {
  const { data, error } = await supabase
    .from("groups")
    .update({ name })
    .eq("id", groupId)
    .eq("user_id", userId)
    .select("id, name")
    .single();

  if (error) return handleServiceError(error);
  return { success: true, data };
}

/**
 * 그룹 해제 헬퍼: 리스트를 독립적으로 변경
 */
async function updateListsToIndependent(userId: string, groupId: number) {
  const { data, error } = await supabase
    .from("lists")
    .update({ group_id: null })
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .select("id");

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * 그룹 해제 헬퍼: 리스트를 메뉴에 추가
 */
async function addListsToMenu(userId: string, lists: { id: number }[]) {
  for (const list of lists) {
    await supabase.rpc("add_menu_item_at_index", {
      p_user_id: userId,
      p_item_type: "list",
      p_item_id: list.id,
      p_index: null,
    });
  }
}

/**
 * 그룹 해제 헬퍼: 그룹 삭제
 */
async function deleteGroupById(userId: string, groupId: number) {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

/**
 * 그룹 해제 (그룹 내 리스트를 독립 리스트로 변환)
 */
export async function dissolveGroup(userId: string, groupId: number): Promise<ServiceResult> {
  try {
    const updatedLists = await updateListsToIndependent(userId, groupId);

    if (updatedLists.length > 0) {
      await addListsToMenu(userId, updatedLists);
    }

    await deleteGroupById(userId, groupId);

    return { success: true, data: { updatedLists: updatedLists.length } };
  } catch (error) {
    return handleServiceError(error as any);
  }
}
