import { useState, useEffect } from "react";
import { Menu, CircleCheckBig } from "lucide-react";
import { systemMenus, type UserMenuProps } from "@/data/SidebarMenuData";
import { useAuth } from "@/hooks/useAuth";
import { getUserMenus } from "@/services/todoMenuService";
import { transformMenuData } from "@/lib/todoMenuUtils";
import SystemMenu from "./SystemMenu";
import UserMenu from "./UserMenu";
import { MenuAddSection } from "./MenuAddSection";

export default function Sidebar() {
  const { user } = useAuth();
  const [userMenus, setUserMenus] = useState<UserMenuProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 메뉴 데이터 로드
  const loadUserMenus = async () => {
    if (!user) return;

    console.log('🔄 [데이터 로드] 사용자 메뉴 로드 시작:', user.id);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await getUserMenus(user.id);

      if (error) throw error;

      if (data) {
        const transformedMenus = transformMenuData(
          data.groups,
          data.independentLists,
          data.groupLists
        );
        setUserMenus(transformedMenus);

        console.log('✅ [데이터 로드] 메뉴 로드 완료:', {
          totalMenus: transformedMenus.length
        });
      }
    } catch (err) {
      console.error('❌ [데이터 로드] 메뉴 로드 실패:', err);
      setError('메뉴 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 로그인 시 데이터 로드
  useEffect(() => {
    loadUserMenus();
  }, [user]);

  const addGroup = (group: UserMenuProps) => {
    console.log('➕ [UI 상태] 그룹 추가:', {
      id: group.id,
      text: group.text,
      type: group.type,
      isTemp: group.isTemp,
      isPending: group.isPending
    });
    setUserMenus(prev => [...prev, group]);

    // 실제 DB 저장 성공 시 데이터 다시 로드
    if (!group.isTemp && !group.isPending) {
      console.log('🔄 [실제 저장 완료] 그룹 저장 완료, 데이터 재로드');
      setTimeout(() => loadUserMenus(), 100); // 잠시 후 다시 로드
    }
  };

  const addList = (list: UserMenuProps) => {
    console.log('➕ [UI 상태] 목록 추가:', {
      id: list.id,
      text: list.text,
      type: list.type,
      isTemp: list.isTemp,
      isPending: list.isPending
    });
    setUserMenus(prev => [...prev, list]);

    // 실제 DB 저장 성공 시 데이터 다시 로드
    if (!list.isTemp && !list.isPending) {
      console.log('🔄 [실제 저장 완료] 목록 저장 완료, 데이터 재로드');
      setTimeout(() => loadUserMenus(), 100); // 잠시 후 다시 로드
    }
  };

  const removeMenu = (id: string) => {
    console.log('➖ [UI 상태] 메뉴 제거:', { id });
    setUserMenus(prev => prev.filter(menu => menu.id.toString() !== id));
  };

  const updateMenu = (updatedItem: UserMenuProps) => {
    console.log('🔄 [UI 상태] 메뉴 업데이트:', {
      id: updatedItem.id,
      text: updatedItem.text,
      isTemp: updatedItem.isTemp,
      isPending: updatedItem.isPending
    });
    setUserMenus(prev =>
      prev.map(menu =>
        menu.id.toString() === updatedItem.id.toString() ? updatedItem : menu
      )
    );
  };

  return (
    <aside className="w-64 vh-100 border-r border-border">
      {/* Spread Button */}
      <button className="ml-1 p-2 rounded-md cursor-pointer">
        <Menu size={16} />
      </button>

      {/* System Menus */}
      <nav>
        {systemMenus.map((item) => (
          <SystemMenu
            key={item.id}
            icon={item.icon}
            text={item.text}
            count={item.count}
          />
        ))}
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
              onClick={loadUserMenus}
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
            <UserMenu key={item.id} menu={item} />
          ))
        )}
      </nav>

      {/* Separator */}
      <div className="px-4 mt-4">
        <div className="border-t border-gray-300"></div>
      </div>

      {/* Menu Add Buttons */}
      <MenuAddSection
        onGroupAdd={addGroup}
        onListAdd={addList}
        onMenuRemove={removeMenu}
        onMenuUpdate={updateMenu}
        userMenus={userMenus}
      />
    </aside>
  );
}
