import { useCallback } from "react";
import { getUserMenus, getSystemMenuCounts } from "@/services/todoMenu";
import { transformRpcMenuData } from "@/lib/todoMenuUtils";
import { toast } from "@/hooks/useToast";
import { contextLogger } from "@/lib/logger";
import type { UserMenuProps } from "@/data/SidebarMenuData";

interface SystemMenuCounts {
  today: number;
  important: number;
  tasks: number;
}

interface UseMenuDataReturn {
  loadUserMenus: (userId: string) => Promise<UserMenuProps[] | null>;
  loadSystemMenuCounts: (userId: string) => Promise<SystemMenuCounts | null>;
}

/**
 * 메뉴 데이터 로딩 로직을 담당하는 커스텀 훅
 */
export function useTodoMenuData(): UseMenuDataReturn {
  // 사용자 메뉴 데이터 로드
  const loadUserMenus = useCallback(async (userId: string): Promise<UserMenuProps[] | null> => {
    contextLogger.start("사용자 메뉴 로드 시작", { userId });

    try {
      const result = await getUserMenus(userId);

      if (!result.success) throw new Error(result.error);

      if (result.data) {
        const transformedMenus = transformRpcMenuData(result.data as any[]);

        contextLogger.success("메뉴 로드 완료", {
          totalMenus: transformedMenus.length,
        });

        return transformedMenus;
      }

      return null;
    } catch (err) {
      contextLogger.error("메뉴 로드 실패", { error: err });
      toast.error("메뉴 데이터를 불러오는데 실패했습니다.");
      return null;
    }
  }, []);

  // 시스템 메뉴 카운트 로드
  const loadSystemMenuCounts = useCallback(async (userId: string): Promise<SystemMenuCounts | null> => {
    try {
      const result = await getSystemMenuCounts(userId);

      if (!result.success) throw new Error(result.error);

      if (result.data) {
        contextLogger.success("시스템 메뉴 카운트 로드 완료", result.data as Record<string, unknown>);
        return result.data as SystemMenuCounts;
      }

      return null;
    } catch (err) {
      contextLogger.error("시스템 메뉴 카운트 로드 실패", { error: err });
      return null;
    }
  }, []);

  return {
    loadUserMenus,
    loadSystemMenuCounts,
  };
}
