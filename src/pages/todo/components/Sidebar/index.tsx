import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Menu, CircleCheckBig } from "lucide-react";
import { systemMenus, type UserMenuProps, type SystemMenuProps } from "@/data/SidebarMenuData";
import { useAuthContext } from "@/hooks/useAuthContext";
import {
  getUserMenus,
  deleteList,
  dissolveGroup,
} from "@/services/todoMenuService";
import { transformRpcMenuData } from "@/lib/todoMenuUtils";
import { toast } from "@/hooks/useToast";
import SystemMenu from "./SystemMenu";
import UserMenu from "./UserMenu";
import { MenuAddSection } from "./MenuAddSection";

export default function Sidebar() {
  const { user } = useAuthContext();
  const { listId } = useParams();
  const [userMenus, setUserMenus] = useState<UserMenuProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 메뉴 데이터 로드 - 원래 로직으로 복원
  const loadUserMenus = useCallback(async (userId: string) => {
    console.log("🔄 [데이터 로드] 사용자 메뉴 로드 시작:", userId);
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserMenus(userId);

      if (!result.success) throw new Error(result.error);

      if (result.data) {
        const transformedMenus = transformRpcMenuData(result.data);
        setUserMenus(transformedMenus);

        console.log("✅ [데이터 로드] 최적화된 메뉴 로드 완료:", {
          totalMenus: transformedMenus.length,
        });
      }
    } catch (err) {
      console.error("❌ [데이터 로드] 메뉴 로드 실패:", err);
      setError("메뉴 데이터를 불러오는데 실패했습니다.");
      toast.error("메뉴 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 사용자 로그인 시 데이터 로드 - user?.id 직접 의존성으로 사용
  useEffect(() => {
    if (user?.id) {
      loadUserMenus(user.id);
    }
  }, [user?.id, loadUserMenus]);


  const handleDeleteList = async (listId: number) => {
    if (!user?.id) return;

    console.log("🗑️ [목록 삭제] 시작:", { listId });

    // 낙관적 UI 업데이트 - 즉시 UI에서 제거
    const originalMenus = [...userMenus];
    setUserMenus((prev) => prev.filter((menu) => menu.id !== listId));

    try {
      const result = await deleteList(user.id, listId);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("✅ [목록 삭제] 성공:", { listId });
    } catch (error) {
      console.error("❌ [목록 삭제] 실패:", error);
      // 실패 시 원상복구
      setUserMenus(originalMenus);
      toast.error("목록 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleDissolveGroup = async (groupId: number) => {
    if (!user?.id) return;

    console.log("📦 [그룹 해제] 시작:", { groupId });

    // 낙관적 UI 업데이트: 그룹을 제거하고 자식 목록들을 독립 목록으로 변환
    const originalMenus = [...userMenus];
    const targetGroup = userMenus.find(menu => menu.id === groupId && menu.type === "group");

    if (!targetGroup) {
      console.error("해제할 그룹을 찾을 수 없습니다:", groupId);
      return;
    }

    // 그룹의 자식 목록들을 독립 목록으로 변환하여 UI 업데이트
    setUserMenus(prev => {
      const filteredMenus = prev.filter(menu => menu.id !== groupId);
      const childLists = targetGroup.children || [];

      // 자식 목록들을 독립 목록으로 추가
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

    try {
      const result = await dissolveGroup(user.id, groupId);

      if (!result.success) {
        throw new Error(result.error);
      }

      console.log("✅ [그룹 해제] 성공:", { groupId });
      // 성공 시 추가 작업 없음 (이미 낙관적 UI로 처리됨)
    } catch (error) {
      console.error("❌ [그룹 해제] 실패:", error);
      // 실패 시 원상복구
      setUserMenus(originalMenus);
      toast.error("그룹 해제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <aside className="w-64 vh-100 border-r border-border">
      {/* Spread Button */}
      <button className="ml-1 p-2 rounded-md cursor-pointer">
        <Menu size={16} />
      </button>

      {/* System Menus */}
      <nav>
        {systemMenus.map((item) => {
          // System 메뉴 활성화 확인
          const isActive = listId === item.virtualId;

          return (
            <SystemMenu
              key={item.id}
              icon={item.icon}
              text={item.text}
              count={item.count}
              virtualId={item.virtualId}
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* Separator */}
      <div className="px-4 my-4">
        <div className="border-t border-gray-300"></div>
      </div>

      {/* User Menus */}
      <nav>
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm">메뉴를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-destructive">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => user?.id && loadUserMenus(user.id)}
              className="mt-2 text-xs underline hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        ) : userMenus.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <CircleCheckBig className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">첫 번째 목록을 추가해보세요</p>
          </div>
        ) : (
          userMenus.map((item) => (
            <UserMenu
              key={`${item.type}-${item.id}`}
              menu={item}
              onDeleteList={handleDeleteList}
              onDissolveGroup={handleDissolveGroup}
              activeListId={listId}
            />
          ))
        )}
      </nav>

      {/* Separator */}
      <div className="px-4 mt-4">
        <div className="border-t border-gray-300"></div>
      </div>

      {/* Menu Add Buttons */}
      <MenuAddSection
        setUserMenus={setUserMenus}
      />
    </aside>
  );
}
