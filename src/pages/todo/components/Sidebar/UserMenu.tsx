import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Ungroup } from "lucide-react";
import ListMenu from "./ListMenu";
import GroupMenu from "./GroupMenu";
import SimpleDropdown from "@/components/ui/SimpleDropdown";
import type { UserMenuProps } from "@/data/SidebarMenuData";

interface ComponentProps {
  menu: UserMenuProps;
  onDeleteList?: (listId: number) => void;
  onDissolveGroup?: (groupId: number) => void;
  activeListId?: string;
}

export default function UserMenu({
  menu,
  onDeleteList,
  onDissolveGroup,
  activeListId,
}: ComponentProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    if (menu.type === "group" && menu.children) {
      setIsOpen(!isOpen);
    }
  };

  const handleDelete = () => {
    if (menu.type === "list" && onDeleteList) {
      onDeleteList(menu.id as number);
    }
  };

  const handleDissolve = () => {
    if (menu.type === "group" && onDissolveGroup) {
      onDissolveGroup(menu.id as number);
    }
  };

  if (menu.type === "list") {
    const isActive = activeListId === String(menu.id);

    return (
      <SimpleDropdown
        triggerType="contextmenu"
        menuItems={[
          {
            label: "목록 삭제",
            icon: <Trash2 className="w-4 h-4" />,
            onClick: handleDelete,
            variant: "destructive",
          },
        ]}
      >
        <Link to={`/todo/${menu.id}`} className="block">
          <ListMenu
            dotSize={2}
            dotColor={menu.color || "gray"}
            text={menu.text}
            count={menu.count || 0}
            isPending={menu.isPending}
            isActive={isActive}
          />
        </Link>
      </SimpleDropdown>
    );
  }

  return (
    <SimpleDropdown
      triggerType="contextmenu"
      menuItems={[
        {
          label: "그룹 해제",
          icon: <Ungroup className="w-4 h-4" />,
          onClick: handleDissolve,
          variant: "destructive",
        },
      ]}
    >
      <GroupMenu
        text={menu.text}
        isOpen={isOpen}
        onToggle={toggleOpen}
        children={menu.children}
        isPending={menu.isPending}
        activeListId={activeListId}
      />
    </SimpleDropdown>
  );
}
