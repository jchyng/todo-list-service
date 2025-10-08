import { useCallback } from "react";
import type { TailwindColor } from "@/constant/TailwindColor";
import type { UserMenuProps } from "@/data/SidebarMenuData";
import {
  updateListColor,
  updateListName,
  updateGroupName,
  deleteList,
  dissolveGroup
} from "@/services/todoMenu";
import { executeOptimisticUpdate } from "@/utils/optimisticHelpers";
import { toast } from "@/hooks/useToast";
import { contextLogger } from "@/lib/logger";

interface UseMenuActionsParams {
  userMenus: UserMenuProps[];
  setUserMenus: React.Dispatch<React.SetStateAction<UserMenuProps[]>>;
}

/**
 * 메뉴 액션 (색상 변경, 이름 변경, 삭제, 그룹 해제)을 처리하는 커스텀 훅
 */
export function useTodoMenuActions({ userMenus, setUserMenus }: UseMenuActionsParams) {
  // 메뉴 색상 업데이트
  const updateMenuColor = useCallback(async (
    listId: number,
    color: TailwindColor,
    userId: string
  ) => {
    const originalMenus = [...userMenus];

    const result = await executeOptimisticUpdate({
      setState: setUserMenus,
      optimisticUpdate: (prev) => prev.map(menu => {
        if (menu.type === "list" && menu.id === listId) {
          return { ...menu, color };
        }
        // 그룹 내 리스트 업데이트
        if (menu.type === "group" && menu.children) {
          const updatedChildren = menu.children.map(child =>
            child.id === listId ? { ...child, color } : child
          );
          return { ...menu, children: updatedChildren };
        }
        return menu;
      }),
      asyncOperation: async () => {
        const result = await updateListColor(userId, listId, color);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      },
      rollbackState: originalMenus,
      onError: (error) => {
        contextLogger.error("색상 업데이트 실패", { error, listId, color });
        toast.error("색상 변경에 실패했습니다. 다시 시도해주세요.");
      }
    });

    if (result) {
      contextLogger.success("색상 업데이트 성공", { listId, color });
    }
  }, [userMenus, setUserMenus]);

  // 메뉴 이름 업데이트
  const updateMenuName = useCallback(async (
    menuId: number,
    name: string,
    userId: string,
    menuType: "list" | "group"
  ) => {
    const originalMenus = [...userMenus];

    const result = await executeOptimisticUpdate({
      setState: setUserMenus,
      optimisticUpdate: (prev) => prev.map(menu => {
        if (menu.id === menuId && menu.type === menuType) {
          return { ...menu, text: name };
        }
        // 그룹 내 리스트 업데이트
        if (menu.type === "group" && menu.children && menuType === "list") {
          const updatedChildren = menu.children.map(child =>
            child.id === menuId ? { ...child, text: name } : child
          );
          return { ...menu, children: updatedChildren };
        }
        return menu;
      }),
      asyncOperation: async () => {
        const result = menuType === "list"
          ? await updateListName(userId, menuId, name)
          : await updateGroupName(userId, menuId, name);

        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      },
      rollbackState: originalMenus,
      onError: (error) => {
        contextLogger.error(`${menuType === "list" ? "목록" : "그룹"} 이름 업데이트 실패`, { error, menuId, name, menuType });
        toast.error("이름 변경에 실패했습니다. 다시 시도해주세요.");
      }
    });

    if (result) {
      contextLogger.success(`${menuType === "list" ? "목록" : "그룹"} 이름 업데이트 성공`, { menuId, name, menuType });
    }
  }, [userMenus, setUserMenus]);

  // 메뉴 삭제
  const deleteMenu = useCallback(async (listId: number, userId: string) => {
    const originalMenus = [...userMenus];

    const result = await executeOptimisticUpdate({
      setState: setUserMenus,
      optimisticUpdate: (prev) => prev.filter(menu => menu.id !== listId),
      asyncOperation: async () => {
        const result = await deleteList(userId, listId);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      },
      rollbackState: originalMenus,
      onError: (error) => {
        contextLogger.error("목록 삭제 실패", { error, listId });
        toast.error("목록 삭제에 실패했습니다. 다시 시도해주세요.");
      }
    });

    if (result) {
      contextLogger.success("목록 삭제 성공", { listId });
    }
  }, [userMenus, setUserMenus]);

  // 그룹 해제
  const dissolveMenuGroup = useCallback(async (groupId: number, userId: string) => {
    const originalMenus = [...userMenus];
    const targetGroup = userMenus.find(menu => menu.id === groupId && menu.type === "group");

    if (!targetGroup) {
      contextLogger.error("해제할 그룹을 찾을 수 없습니다", { groupId });
      return;
    }

    const result = await executeOptimisticUpdate({
      setState: setUserMenus,
      optimisticUpdate: (prev) => {
        const filteredMenus = prev.filter(menu => menu.id !== groupId);
        const childLists = targetGroup.children || [];

        const independentLists = childLists.map(child => ({
          ...child,
          id: child.id,
          text: child.text,
          type: "list" as const,
          color: child.color,
          count: child.count || 0,
          isPending: false,
        }));

        return [...filteredMenus, ...independentLists];
      },
      asyncOperation: async () => {
        const result = await dissolveGroup(userId, groupId);
        if (!result.success) {
          throw new Error(result.error);
        }
        return result;
      },
      rollbackState: originalMenus,
      onError: (error) => {
        contextLogger.error("그룹 해제 실패", { error, groupId });
        toast.error("그룹 해제에 실패했습니다. 다시 시도해주세요.");
      }
    });

    if (result) {
      contextLogger.success("그룹 해제 성공", { groupId });
    }
  }, [userMenus, setUserMenus]);

  return {
    updateMenuColor,
    updateMenuName,
    deleteMenu,
    dissolveMenuGroup,
  };
}
