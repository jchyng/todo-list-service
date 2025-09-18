import { generateKeyBetween } from "fractional-indexing";
import type { UserMenuProps } from "@/data/SidebarMenuData";

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