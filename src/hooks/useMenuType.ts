import { useMemo } from "react";
import { systemMenus, type SystemMenuProps } from "@/data/SidebarMenuData";

type MenuType = "system" | "list" | "none" | "unknown";

interface MenuInfo {
  type: MenuType;
  data: SystemMenuProps | { id: number } | null;
}

/**
 * 메뉴 타입 결정 Hook
 * URL의 listId가 가상 메뉴인지 실제 리스트인지 판단
 */
export function useMenuType(listId: string | undefined): MenuInfo {
  return useMemo(() => {
    if (!listId) {
      return { type: "none", data: null };
    }

    // 숫자인지 확인 (실제 리스트 ID)
    if (!isNaN(Number(listId))) {
      return { type: "list", data: { id: Number(listId) } };
    }

    // 가상 메뉴인지 확인
    const systemMenu = systemMenus.find((menu) => menu.virtualId === listId);
    if (systemMenu) {
      return { type: "system", data: systemMenu };
    }

    return { type: "unknown", data: null };
  }, [listId]);
}
