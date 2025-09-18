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

/**
 * @deprecated 이 함수는 성능상 이유로 더 이상 사용되지 않습니다.
 * 대신 getUserMenusOptimized()를 사용해주세요.
 * 3개의 개별 쿼리 대신 1개의 최적화된 SQL 함수를 사용합니다.
 *
 * 사용자의 모든 메뉴 조회 (그룹 + 독립 목록) - DEPRECATED
 * @param userId - 사용자 ID
 * @returns 그룹, 독립 목록, 그룹별 목록 데이터 또는 에러
 */
export async function getUserMenus(userId: string) {
  try {
    // 1. 그룹 조회
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .eq('user_id', userId)
      .order('position');

    if (groupsError) throw groupsError;

    // 2. 독립 목록 조회 (group_id가 null이고 is_system이 false인 것들)
    const { data: independentLists, error: listsError } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .is('group_id', null)
      .eq('is_system', false)
      .order('position');

    if (listsError) throw listsError;

    // 3. 각 그룹에 속한 목록들 조회 (is_system이 false인 것들만)
    const { data: groupLists, error: groupListsError } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .not('group_id', 'is', null)
      .eq('is_system', false)
      .order('position');

    if (groupListsError) throw groupListsError;

    console.log('📊 [DB 조회] 사용자 메뉴 데이터:', {
      groups: groups?.length || 0,
      independentLists: independentLists?.length || 0,
      groupLists: groupLists?.length || 0
    });

    return {
      data: { groups: groups || [], independentLists: independentLists || [], groupLists: groupLists || [] },
      error: null
    };
  } catch (error) {
    console.error("❌ 사용자 메뉴 조회 실패:", error);
    return { data: null, error };
  }
}

/**
 * 사용자의 모든 메뉴 조회 (최적화된 버전)
 * PostgreSQL 함수를 통해 1번의 쿼리로 모든 데이터 조회
 * @param userId - 사용자 ID
 * @returns 최적화된 메뉴 데이터 또는 에러
 */
export async function getUserMenusOptimized(userId: string) {
  try {
    console.log('🚀 [최적화 조회] RPC 함수 호출 시작:', userId);

    const { data, error } = await supabase.rpc('get_user_menus', {
      p_user_id: userId
    });

    if (error) throw error;

    console.log('✅ [최적화 조회] RPC 함수 호출 완료:', {
      totalRows: data?.length || 0,
      types: data?.reduce((acc: any, item: any) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {})
    });

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ 최적화된 사용자 메뉴 조회 실패:", error);
    return { data: null, error };
  }
}
