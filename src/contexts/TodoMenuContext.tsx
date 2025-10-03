import { createContext, useContext, useState, useCallback, useEffect, startTransition, type ReactNode } from "react";
import type { UserMenuProps } from "@/data/SidebarMenuData";
import type { TailwindColor } from "@/constant/TailwindColor";
import {
  getUserMenus,
  getSystemMenuCounts,
  updateListColor,
  updateListName,
  updateGroupName,
  deleteList,
  dissolveGroup
} from "@/services/todoMenuService";
import { transformRpcMenuData } from "@/lib/todoMenuUtils";
import { toast } from "@/hooks/useToast";
import { contextLogger } from "@/lib/logger";

interface SystemMenuCounts {
  today: number;
  important: number;
  tasks: number;
}

interface TodoMenuContextType {
  userMenus: UserMenuProps[];
  systemMenuCounts: SystemMenuCounts;
  isLoading: boolean;
  error: string | null;
  loadUserMenus: (userId: string) => Promise<void>;
  loadSystemMenuCounts: (userId: string) => Promise<void>;
  updateMenuColor: (listId: number, color: TailwindColor, userId: string) => Promise<void>;
  updateMenuName: (menuId: number, name: string, userId: string, menuType: "list" | "group") => Promise<void>;
  deleteMenu: (listId: number, userId: string) => Promise<void>;
  dissolveMenuGroup: (groupId: number, userId: string) => Promise<void>;
  setUserMenus: React.Dispatch<React.SetStateAction<UserMenuProps[]>>;
}

const TodoMenuContext = createContext<TodoMenuContextType | undefined>(undefined);

interface TodoMenuProviderProps {
  children: ReactNode;
  userId?: string;
}

export function TodoMenuProvider({ children, userId }: TodoMenuProviderProps) {
  const [userMenus, setUserMenus] = useState<UserMenuProps[]>([]);
  const [systemMenuCounts, setSystemMenuCounts] = useState<SystemMenuCounts>({
    today: 0,
    important: 0,
    tasks: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 메뉴 데이터 로드
  const loadUserMenus = useCallback(async (userId: string) => {
    contextLogger.start("사용자 메뉴 로드 시작", { userId });
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserMenus(userId);

      if (!result.success) throw new Error(result.error);

      if (result.data) {
        const transformedMenus = transformRpcMenuData(result.data);
        setUserMenus(transformedMenus);

        contextLogger.success("메뉴 로드 완료", {
          totalMenus: transformedMenus.length,
        });
      }
    } catch (err) {
      contextLogger.error("메뉴 로드 실패", { error: err });
      setError("메뉴 데이터를 불러오는데 실패했습니다.");
      toast.error("메뉴 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 메뉴 색상 업데이트
  const updateMenuColor = useCallback(async (listId: number, color: TailwindColor, userId: string) => {
    // 낙관적 업데이트 - UI 즉시 반영
    const originalMenus = [...userMenus];
    startTransition(() => {
      setUserMenus(prev => prev.map(menu => {
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
      }));
    });

    try {
      const result = await updateListColor(userId, listId, color);
      if (!result.success) {
        throw new Error(result.error);
      }
      contextLogger.success("색상 업데이트 성공", { listId, color });
    } catch (error) {
      contextLogger.error("색상 업데이트 실패", { error, listId, color });
      // 실패 시 롤백
      setUserMenus(originalMenus);
      toast.error("색상 변경에 실패했습니다. 다시 시도해주세요.");
      throw error;
    }
  }, [userMenus]);

  // 메뉴 이름 업데이트
  const updateMenuName = useCallback(async (menuId: number, name: string, userId: string, menuType: "list" | "group") => {
    // 낙관적 업데이트 - UI 즉시 반영
    const originalMenus = [...userMenus];
    startTransition(() => {
      setUserMenus(prev => prev.map(menu => {
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
      }));
    });

    try {
      const result = menuType === "list"
        ? await updateListName(userId, menuId, name)
        : await updateGroupName(userId, menuId, name);

      if (!result.success) {
        throw new Error(result.error);
      }
      contextLogger.success(`${menuType === "list" ? "목록" : "그룹"} 이름 업데이트 성공`, { menuId, name, menuType });
    } catch (error) {
      contextLogger.error(`${menuType === "list" ? "목록" : "그룹"} 이름 업데이트 실패`, { error, menuId, name, menuType });
      // 실패 시 롤백
      setUserMenus(originalMenus);
      toast.error("이름 변경에 실패했습니다. 다시 시도해주세요.");
      throw error;
    }
  }, [userMenus]);

  // 메뉴 삭제
  const deleteMenu = useCallback(async (listId: number, userId: string) => {
    const originalMenus = [...userMenus];
    startTransition(() => {
      setUserMenus(prev => prev.filter(menu => menu.id !== listId));
    });

    try {
      const result = await deleteList(userId, listId);
      if (!result.success) {
        throw new Error(result.error);
      }
      contextLogger.success("목록 삭제 성공", { listId });
    } catch (error) {
      contextLogger.error("목록 삭제 실패", { error, listId });
      setUserMenus(originalMenus);
      toast.error("목록 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  }, [userMenus]);

  // 그룹 해제
  const dissolveMenuGroup = useCallback(async (groupId: number, userId: string) => {
    const originalMenus = [...userMenus];
    const targetGroup = userMenus.find(menu => menu.id === groupId && menu.type === "group");

    if (!targetGroup) {
      contextLogger.error("해제할 그룹을 찾을 수 없습니다", { groupId });
      return;
    }

    startTransition(() => {
      setUserMenus(prev => {
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
      });
    });

    try {
      const result = await dissolveGroup(userId, groupId);
      if (!result.success) {
        throw new Error(result.error);
      }
      contextLogger.success("그룹 해제 성공", { groupId });
    } catch (error) {
      contextLogger.error("그룹 해제 실패", { error, groupId });
      setUserMenus(originalMenus);
      toast.error("그룹 해제에 실패했습니다. 다시 시도해주세요.");
    }
  }, [userMenus]);

  // 시스템 메뉴 카운트 로드
  const loadSystemMenuCounts = useCallback(async (userId: string) => {
    try {
      const result = await getSystemMenuCounts(userId);

      if (!result.success) throw new Error(result.error);

      if (result.data) {
        setSystemMenuCounts(result.data);
        contextLogger.success("시스템 메뉴 카운트 로드 완료", result.data);
      }
    } catch (err) {
      contextLogger.error("시스템 메뉴 카운트 로드 실패", { error: err });
      // 에러 발생 시에도 기본값 유지
    }
  }, []);

  // userId가 변경되면 자동으로 메뉴 로드
  useEffect(() => {
    if (userId) {
      loadUserMenus(userId);
      loadSystemMenuCounts(userId);
    }
  }, [userId, loadUserMenus, loadSystemMenuCounts]);

  const value: TodoMenuContextType = {
    userMenus,
    systemMenuCounts,
    isLoading,
    error,
    loadUserMenus,
    loadSystemMenuCounts,
    updateMenuColor,
    updateMenuName,
    deleteMenu,
    dissolveMenuGroup,
    setUserMenus,
  };

  return (
    <TodoMenuContext.Provider value={value}>
      {children}
    </TodoMenuContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTodoMenuContext(): TodoMenuContextType {
  const context = useContext(TodoMenuContext);

  if (context === undefined) {
    throw new Error("useTodoMenuContext는 TodoMenuProvider 내에서만 사용할 수 있습니다");
  }

  return context;
}