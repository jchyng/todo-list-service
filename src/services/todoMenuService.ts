import type { TailwindColor } from "@/constant/TailwindColor";
import { supabase } from "@/lib/supabase";

/**
 * Todo 메뉴(그룹, 리스트) 생성 관련 서비스
 */

/**
 * 새로운 그룹 생성 (DB에서 자동 position 계산)
 * @param userId - 사용자 ID
 * @param name - 그룹 이름
 * @param afterPosition - 이 position 뒤에 추가 (선택사항, 없으면 맨 뒤)
 * @returns 생성된 그룹 데이터 또는 에러
 */
export async function createGroup(
  userId: string,
  name: string,
  afterPosition?: string
) {
  try {
    // 1. 그룹 생성
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        user_id: userId,
        name,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // 2. DB에서 자동으로 position 계산하여 추가
    const { data: position, error: positionError } = await supabase.rpc('add_menu_item', {
      p_user_id: userId,
      p_item_type: 'group',
      p_item_id: group.id,
      p_after_position: afterPosition || null
    });

    if (positionError) {
      // 실패시 그룹 삭제 (롤백)
      await supabase.from("groups").delete().eq("id", group.id);
      throw positionError;
    }

    return { data: { ...group, position }, error: null };
  } catch (error) {
    console.error("❌ 그룹 생성 실패:", error);
    return { data: null, error };
  }
}

/**
 * 새로운 리스트 생성 (DB에서 자동 position 계산)
 * @param userId - 사용자 ID
 * @param name - 리스트 이름
 * @param color - 리스트 색상
 * @param groupId - 그룹 ID (선택사항)
 * @param afterPosition - 이 position 뒤에 추가 (선택사항, 없으면 맨 뒤)
 * @param isSystem - 시스템 리스트 여부 (기본값: false)
 * @returns 생성된 리스트 데이터 또는 에러
 */
export async function createList(
  userId: string,
  name: string,
  color: TailwindColor | null = null,
  groupId: number | null = null,
  afterPosition?: string,
  isSystem: boolean = false
) {
  try {
    // 1. 리스트 생성
    const { data: list, error: listError } = await supabase
      .from("lists")
      .insert({
        user_id: userId,
        group_id: groupId,
        color,
        name,
        is_system: isSystem,
      })
      .select()
      .single();

    if (listError) throw listError;

    // 2. 시스템 리스트가 아닌 경우에만 menu_positions에 추가
    if (!isSystem) {
      const { data: position, error: positionError } = await supabase.rpc('add_menu_item', {
        p_user_id: userId,
        p_item_type: 'list',
        p_item_id: list.id,
        p_after_position: afterPosition || null
      });

      if (positionError) {
        // 실패시 리스트 삭제 (롤백)
        await supabase.from("lists").delete().eq("id", list.id);
        throw positionError;
      }

      return { data: { ...list, position }, error: null };
    }

    return { data: list, error: null };
  } catch (error) {
    console.error("❌ 리스트 생성 실패:", error);
    return { data: null, error };
  }
}

export async function createDefaultSystemList(userId: string) {
  return createList(userId, "작업", null, null, undefined, true);
}


/**
 * 목록 삭제
 * @param userId - 사용자 ID
 * @param listId - 삭제할 목록 ID
 * @returns 삭제 결과 또는 에러
 */
export async function deleteList(userId: string, listId: number) {
  try {
    // 1. menu_positions에서 삭제
    await supabase.rpc('remove_menu_item', {
      p_user_id: userId,
      p_item_type: 'list',
      p_item_id: listId
    });

    // 2. 목록 삭제
    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", userId);

    if (error) throw error;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("❌ 목록 삭제 실패:", error);
    return { data: null, error };
  }
}

/**
 * 그룹 해제 (그룹 내 모든 목록을 독립 목록으로 변환)
 * @param userId - 사용자 ID
 * @param groupId - 해제할 그룹 ID
 * @returns 해제 결과 또는 에러
 */
export async function dissolveGroup(userId: string, groupId: number) {
  try {
    // 1. 그룹에 속한 모든 목록 조회
    const { data: groupLists, error: listsError } = await supabase
      .from("lists")
      .select("*")
      .eq("user_id", userId)
      .eq("group_id", groupId);

    if (listsError) throw listsError;

    if (groupLists && groupLists.length > 0) {
      // 2. 각 목록을 독립 목록으로 변경
      for (const list of groupLists) {
        // group_id 제거
        await supabase
          .from("lists")
          .update({ group_id: null })
          .eq("id", list.id);

        // 새로운 position으로 메뉴에 추가 (맨 뒤에)
        await supabase.rpc('add_menu_item', {
          p_user_id: userId,
          p_item_type: 'list',
          p_item_id: list.id,
          p_after_position: null
        });
      }
    }

    // 3. 그룹 position 삭제
    await supabase.rpc('remove_menu_item', {
      p_user_id: userId,
      p_item_type: 'group',
      p_item_id: groupId
    });

    // 4. 그룹 삭제
    const { error: deleteError } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    return { data: { success: true, updatedLists: groupLists?.length || 0 }, error: null };
  } catch (error) {
    console.error("❌ 그룹 해제 실패:", error);
    return { data: null, error };
  }
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
 * 사용자의 모든 메뉴 조회 (position 기반)
 * @param userId - 사용자 ID
 * @returns 메뉴 데이터 또는 에러
 */
export async function getUserMenusOptimized(userId: string) {
  try {
    console.log('🚀 [메뉴 조회] RPC 함수 호출 시작:', userId);

    const { data, error } = await supabase.rpc('get_user_menus_with_positions', {
      p_user_id: userId
    });

    if (error) throw error;

    console.log('✅ [메뉴 조회] RPC 함수 호출 완료:', {
      totalRows: data?.length || 0,
      types: data?.reduce((acc: Record<string, number>, item: unknown) => {
        const typedItem = item as {type: string};
        acc[typedItem.type] = (acc[typedItem.type] || 0) + 1;
        return acc;
      }, {})
    });

    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ 사용자 메뉴 조회 실패:", error);
    return { data: null, error };
  }
}
