import { Menu } from "lucide-react";
import { systemMenus, userMenus } from "@/data/SidebarMenuData";
import SystemMenu from "./SystemMenu";
import UserMenu from "./UserMenu";
import { MenuAddSection } from "./MenuAddSection";

export default function Sidebar() {
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
      <MenuAddSection />
    </aside>
  );
}
