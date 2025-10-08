import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { UserMenuProps } from "@/data/SidebarMenuData";
import type { TailwindColor } from "@/constant/TailwindColor";
import { useTodoMenuData } from "@/hooks/useTodoMenuData";
import { useTodoMenuActions } from "@/hooks/useTodoMenuActions";

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

  // 커스텀 훅 사용
  const menuData = useTodoMenuData();
  const menuActions = useTodoMenuActions({ userMenus, setUserMenus });

  // 사용자 메뉴 로드 래퍼
  const loadUserMenus = async (userId: string) => {
    setIsLoading(true);
    setError(null);

    const menus = await menuData.loadUserMenus(userId);
    if (menus) {
      setUserMenus(menus);
    } else {
      setError("메뉴 데이터를 불러오는데 실패했습니다.");
    }

    setIsLoading(false);
  };

  // 시스템 메뉴 카운트 로드 래퍼
  const loadSystemMenuCounts = async (userId: string) => {
    const counts = await menuData.loadSystemMenuCounts(userId);
    if (counts) {
      setSystemMenuCounts(counts);
    }
  };

  // userId가 변경되면 자동으로 메뉴 로드
  useEffect(() => {
    if (userId) {
      loadUserMenus(userId);
      loadSystemMenuCounts(userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const value: TodoMenuContextType = {
    userMenus,
    systemMenuCounts,
    isLoading,
    error,
    loadUserMenus,
    loadSystemMenuCounts,
    updateMenuColor: menuActions.updateMenuColor,
    updateMenuName: menuActions.updateMenuName,
    deleteMenu: menuActions.deleteMenu,
    dissolveMenuGroup: menuActions.dissolveMenuGroup,
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
