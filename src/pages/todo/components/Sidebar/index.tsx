import { useParams } from "react-router-dom";
import { Menu, CircleCheckBig } from "lucide-react";
import { systemMenus } from "@/data/SidebarMenuData";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useTodoMenuContext } from "@/contexts/TodoMenuContext";
import SystemMenu from "./SystemMenu";
import UserMenu from "./UserMenu";
import { MenuAddSection } from "./MenuAddSection";

export default function Sidebar() {
  const { user } = useAuthContext();
  const { listId } = useParams();
  const {
    userMenus,
    isLoading,
    error,
    loadUserMenus,
    deleteMenu,
    dissolveMenuGroup,
    setUserMenus
  } = useTodoMenuContext();

  const handleDeleteList = async (listId: number) => {
    if (!user?.id) return;
    await deleteMenu(listId, user.id);
  };

  const handleDissolveGroup = async (groupId: number) => {
    if (!user?.id) return;
    await dissolveMenuGroup(groupId, user.id);
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
