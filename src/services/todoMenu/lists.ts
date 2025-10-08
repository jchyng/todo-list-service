import type { TailwindColor } from "@/constant/TailwindColor";
import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";

/**
 * 리스트 생성
 */
export async function createList(
  userId: string,
  name: string,
  color: TailwindColor | null = null,
  groupId: number | null = null,
  index?: number
): Promise<ServiceResult> {
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

  if (listError) return handleServiceError(listError);

  const { error: positionError } = await supabase.rpc(
    "add_menu_item_at_index",
    {
      p_user_id: userId,
      p_item_type: "list",
      p_item_id: list.id,
      p_index: index ?? null,
    }
  );

  if (positionError) {
    console.error("RPC add_menu_item_at_index error:", {
      error: positionError,
      params: { p_user_id: userId, p_item_type: "list", p_item_id: list.id, p_index: index ?? null }
    });
    return handleServiceError(positionError);
  }

  return { success: true, data: list };
}

/**
 * 시스템 리스트 생성
 */
export async function createSystemList(
  userId: string,
  name: string,
  color: TailwindColor | null = null
): Promise<ServiceResult> {
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

  if (error) return handleServiceError(error);
  return { success: true, data };
}

/**
 * 기본 시스템 리스트 생성 ("작업")
 */
export async function createDefaultSystemList(userId: string): Promise<ServiceResult> {
  return createSystemList(userId, "작업");
}

/**
 * 리스트 삭제
 */
export async function deleteList(userId: string, listId: number): Promise<ServiceResult> {
  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) return handleServiceError(error);
  return { success: true };
}

/**
 * 리스트 ID로 조회
 */
export async function getListById(userId: string, listId: number): Promise<ServiceResult> {
  const { data, error } = await supabase
    .from("lists")
    .select("id, name, color, is_system")
    .eq("id", listId)
    .eq("user_id", userId)
    .single();

  if (error) return handleServiceError(error);
  return { success: true, data };
}

/**
 * 리스트 색상 업데이트
 */
export async function updateListColor(
  userId: string,
  listId: number,
  color: TailwindColor
): Promise<ServiceResult> {
  const { data, error } = await supabase
    .from("lists")
    .update({ color })
    .eq("id", listId)
    .eq("user_id", userId)
    .select("id, name, color, is_system")
    .single();

  if (error) return handleServiceError(error);
  return { success: true, data };
}

/**
 * 리스트 이름 업데이트
 */
export async function updateListName(
  userId: string,
  listId: number,
  name: string
): Promise<ServiceResult> {
  const { data, error } = await supabase
    .from("lists")
    .update({ name })
    .eq("id", listId)
    .eq("user_id", userId)
    .select("id, name, color, is_system")
    .single();

  if (error) return handleServiceError(error);
  return { success: true, data };
}
