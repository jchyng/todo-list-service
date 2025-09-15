import { useState } from "react";
import ListMenu from "./ListMenu";
import GroupMenu from "./GroupMenu";
import type { UserMenuProps } from "@/data/SidebarMenuData";

interface ComponentProps {
  menu: UserMenuProps;
}

export default function UserMenu({ menu }: ComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (menu.type === "group" && menu.children) {
      setIsOpen(!isOpen);
    }
  };

  if (menu.type === "list") {
    return (
      <ListMenu
        dotSize={2}
        dotColor={menu.color || "gray"}
        text={menu.text}
        count={menu.count || 0}
      />
    );
  }

  return (
    <GroupMenu
      text={menu.text}
      isOpen={isOpen}
      onToggle={toggleOpen}
      children={menu.children}
    />
  );
}
