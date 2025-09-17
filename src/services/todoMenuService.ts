import type { TailwindColor } from "@/constant/TailwindColor";
import { supabase } from "@/lib/supabase";

/**
 * Todo 메뉴(그룹, 리스트) 생성 관련 서비스
 */

/**
 * 새로운 그룹 생성
 * @param userId - 사용자 ID
 * @param name - 그룹 이름
 * @param position - 그룹 위치
 * @returns 생성된 그룹 데이터 또는 에러
 */
export async function createGroup(
  userId: string,
  name: string,
  position: string
) {
  try {
    const { data, error } = await supabase
      .from("groups")
      .insert({
        user_id: userId,
        name,
        position,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("그룹 생성 실패:", error);
    return { data: null, error };
  }
}

/**
 * 새로운 리스트 생성
 * @param userId - 사용자 ID
 * @param color - 리스트 색상
 * @param name - 리스트 이름
 * @param groupId - 그룹 ID (선택사항)
 * @param position - 리스트 위치
 * @param isSystem - 시스템 리스트 여부 (기본값: false)
 * @returns 생성된 리스트 데이터 또는 에러
 */
export async function createList(
  userId: string,
  name: string,
  color: TailwindColor | null = null,
  groupId: number | null = null,
  position: string,
  isSystem: boolean = false
) {
  try {
    const { data, error } = await supabase
      .from("lists")
      .insert({
        user_id: userId,
        group_id: groupId,
        color,
        name,
        is_system: isSystem,
        position,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("❌ 리스트 생성 실패:", error);
    return { data: null, error };
  }
}

export async function createDefaultSystemList(userId: string) {
  return createList(userId, "작업", null, null, "0", true);
}
