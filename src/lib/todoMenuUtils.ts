import { generateKeyBetween } from "fractional-indexing";
import type { UserMenuProps, ListMenuProps } from "@/data/SidebarMenuData";

/**
 * 임시 ID 생성 유틸리티
 * @param prefix ID 접두사 (예: 'group', 'list')
 */
export const generateTempId = (prefix: string): string => {
  return `temp-${prefix}-${Date.now()}`;
};

/**
 * 새로운 fractional index position 생성
 * @param lastPosition 마지막 아이템의 position (없으면 null)
 */
export const generateNewPosition = (lastPosition?: string | null): string => {
  return generateKeyBetween(lastPosition || null, null);
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