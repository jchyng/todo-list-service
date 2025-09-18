import { useState } from "react";
import { Menu } from "lucide-react";
import { systemMenus, userMenus as staticUserMenus, type UserMenuProps } from "@/data/SidebarMenuData";
import SystemMenu from "./SystemMenu";
import UserMenu from "./UserMenu";
import { MenuAddSection } from "./MenuAddSection";

export default function Sidebar() {
  const [userMenus, setUserMenus] = useState<UserMenuProps[]>(staticUserMenus);

  const addGroup = (group: UserMenuProps) => {
    console.log('➕ [UI 상태] 그룹 추가:', {
      id: group.id,
      text: group.text,
      type: group.type,
      isTemp: group.isTemp,
      isPending: group.isPending
    });
    setUserMenus(prev => [...prev, group]);
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
        {userMenus.map((item) => (
          <UserMenu key={item.id} menu={item} />
        ))}
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
