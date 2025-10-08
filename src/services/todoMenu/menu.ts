import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";

/**
 * 사용자 메뉴 조회 (RPC 함수 사용)
 */
export async function getUserMenus(userId: string): Promise<ServiceResult> {
  const { data, error } = await supabase.rpc("get_user_menus_with_positions", {
    p_user_id: userId,
  });

  if (error) return handleServiceError(error);
  return { success: true, data: data || [] };
}

/**
 * 시스템 메뉴 카운트 조회
 */
export async function getSystemMenuCounts(userId: string): Promise<ServiceResult> {
  const { data, error } = await supabase.rpc("get_system_menu_counts", {
    p_user_id: userId,
  });

  if (error) return handleServiceError(error);
  return { success: true, data };
}

/**
 * 메뉴 아이템 이동 (순서 변경)
 */
export async function moveMenuItem(
  userId: string,
  itemType: "group" | "list",
  itemId: number,
  newIndex: number
): Promise<ServiceResult> {
  const { error } = await supabase.rpc("move_menu_item_to_index", {
    p_user_id: userId,
    p_item_type: itemType,
    p_item_id: itemId,
    p_index: newIndex,
  });

  if (error) return handleServiceError(error);
  return { success: true };
}
