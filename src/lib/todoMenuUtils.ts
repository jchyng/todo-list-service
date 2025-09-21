import type { UserMenuProps, ListMenuProps } from "@/data/SidebarMenuData";

/**
 * 임시 ID 생성 유틸리티
 * @param prefix ID 접두사 (예: 'group', 'list')
 */
export const generateTempId = (prefix: string): string => {
  return `temp-${prefix}-${Date.now()}`;
};

/**
 * 낙관적 그룹 아이템 생성 팩토리
 * @param id 그룹 ID (임시 또는 실제)
 * @param name 그룹 이름
 */
export const createOptimisticGroup = (id: string, name: string): UserMenuProps => ({
  id: id as any, // 임시 ID는 string, 실제 ID는 number로 변환됨
  text: name,
  type: "group",
  children: [],
  isTemp: true,      // 임시 상태로 생성
  isPending: false,
});

/**
 * 낙관적 목록 아이템 생성 팩토리
 * @param id 목록 ID (임시 또는 실제)
 * @param name 목록 이름
 * @param color 목록 색상 (기본: "blue")
 */
export const createOptimisticList = (
  id: string,
  name: string,
  color: string = "blue"
): UserMenuProps => ({
  id: id as any, // 임시 ID는 string, 실제 ID는 number로 변환됨
  text: name,
  type: "list",
  color,
  count: 0,
  isTemp: true,      // 임시 상태로 생성
  isPending: false,
});

/**
 * DB 그룹 데이터를 UserMenuProps로 변환
 * @param group DB에서 가져온 그룹 데이터
 * @param children 그룹에 속한 목록들
 */
export const transformGroupToUserMenu = (group: any, children: any[] = []): UserMenuProps => ({
  id: group.id,
  text: group.name,
  type: "group",
  position: group.position,
  children: children.map(list => transformListToListMenu(list)),
  isTemp: false,
  isPending: false,
});

/**
 * DB 목록 데이터를 UserMenuProps로 변환 (독립 목록용)
 * @param list DB에서 가져온 목록 데이터
 */
export const transformListToUserMenu = (list: any): UserMenuProps => ({
  id: list.id,
  text: list.name,
  type: "list",
  color: list.color || "blue",
  count: 0, // TODO: 실제 할 일 개수 계산
  position: list.position,
  isTemp: false,
  isPending: false,
});

/**
 * DB 목록 데이터를 ListMenuProps로 변환 (그룹 children용)
 * @param list DB에서 가져온 목록 데이터
 */
export const transformListToListMenu = (list: any): ListMenuProps => ({
  id: list.id,
  text: list.name,
  type: "list",
  color: list.color || "blue",
  count: 0, // TODO: 실제 할 일 개수 계산
});

/**
 * DB 조회 결과를 UserMenuProps 배열로 변환
 * @param groups 그룹 데이터 배열
 * @param independentLists 독립 목록 데이터 배열
 * @param groupLists 그룹에 속한 목록 데이터 배열
 */
export const transformMenuData = (
  groups: any[],
  independentLists: any[],
  groupLists: any[]
): UserMenuProps[] => {
  console.log('🔄 [데이터 변환] 변환 시작:', {
    groups: groups.length,
    independentLists: independentLists.length,
    groupLists: groupLists.length
  });

  const result: UserMenuProps[] = [];

  // 1. 그룹들을 UserMenuProps로 변환 (각 그룹에 속한 목록들 포함)
  groups.forEach(group => {
    const childLists = groupLists.filter(list => list.group_id === group.id);
    const transformedGroup = transformGroupToUserMenu(group, childLists);
    result.push(transformedGroup);
  });

  // 2. 독립 목록들을 UserMenuProps로 변환
  independentLists.forEach(list => {
    const transformedList = transformListToUserMenu(list);
    result.push(transformedList);
  });

  console.log('✅ [데이터 변환] 변환 완료:', {
    totalItems: result.length,
    groups: result.filter(item => item.type === 'group').length,
    lists: result.filter(item => item.type === 'list').length
  });

  return result;
};

/**
 * 최적화된 RPC 결과를 UserMenuProps 배열로 변환
 * 통합 position 관리로 group과 list가 올바른 순서로 정렬됨
 * @param optimizedData RPC 함수에서 반환된 플랫 구조 데이터 (이미 position 순으로 정렬됨)
 */
export const transformOptimizedMenuData = (optimizedData: any[]): UserMenuProps[] => {
  console.log('🔄 [최적화 변환] 변환 시작:', {
    totalRows: optimizedData.length,
    firstItem: optimizedData[0]?.position,
    lastItem: optimizedData[optimizedData.length - 1]?.position
  });

  const result: UserMenuProps[] = [];
  const groupsMap = new Map<number, UserMenuProps>();

  // 1. 그룹과 목록을 순서대로 처리 (이미 position으로 정렬된 상태)
  optimizedData.forEach(item => {
    if (item.type === 'group') {
      // 그룹 아이템 생성
      const group: UserMenuProps = {
        id: item.id,
        text: item.name,
        type: "group",
        position: item.position,
        children: [],
        isTemp: false,
        isPending: false,
      };
      groupsMap.set(item.id, group);
      result.push(group);

    } else if (item.type === 'list') {
      // 목록 아이템 생성
      const list: UserMenuProps = {
        id: item.id,
        text: item.name,
        type: "list",
        color: item.color || "blue",
        count: 0, // TODO: 실제 할 일 개수 계산
        position: item.position,
        isTemp: false,
        isPending: false,
      };

      // 그룹에 속한 목록인지 확인
      if (item.parent_id) {
        const parentGroup = groupsMap.get(item.parent_id);
        if (parentGroup && parentGroup.children) {
          // 그룹의 children에 ListMenuProps 형태로 추가 (result에는 추가하지 않음)
          parentGroup.children.push({
            id: item.id,
            text: item.name,
            type: "list",
            color: item.color || "blue",
            count: 0,
          });
        }
      } else {
        // 독립 목록만 result에 추가
        result.push(list);
      }
    }
  });

  // 결과는 이미 position 순으로 정렬되어 있음 (SQL에서 ORDER BY position)
  console.log('✅ [최적화 변환] 변환 완료:', {
    totalItems: result.length,
    groups: result.filter(item => item.type === 'group').length,
    lists: result.filter(item => item.type === 'list').length,
    positionOrder: result.map(item => `${item.type}:${item.position}`).join(' → ')
  });

  // 🔍 Key 중복 디버깅: 그룹과 목록은 서로 다른 테이블에서 오므로 같은 ID를 가질 수 있음
  // React key는 `${item.type}-${item.id}` 형태로 해결됨
  const groupIds = result.filter(item => item.type === 'group').map(item => item.id);
  const listIds = result.filter(item => item.type === 'list').map(item => item.id);
  const groupDuplicates = groupIds.filter((id, index) => groupIds.indexOf(id) !== index);
  const listDuplicates = listIds.filter((id, index) => listIds.indexOf(id) !== index);

  if (groupDuplicates.length > 0 || listDuplicates.length > 0) {
    console.error('🚨 [Key 중복] 같은 타입 내 중복 ID 발견:', {
      groups: groupDuplicates,
      lists: listDuplicates
    });
  } else {
    console.log('✅ [Key 검증] 타입별 ID 중복 없음 (그룹-목록 간 같은 ID는 정상)');
  }

  return result;
};