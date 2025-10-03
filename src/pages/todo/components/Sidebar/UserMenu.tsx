import { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Ungroup, Edit3 } from "lucide-react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useTodoMenuContext } from "@/contexts/TodoMenuContext";
import ListMenu from "./ListMenu";
import GroupMenu from "./GroupMenu";
import SimpleDropdown from "@/components/ui/SimpleDropdown";
import type { UserMenuProps } from "@/data/SidebarMenuData";
import { menuLogger } from "@/lib/logger";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState("");
  const { user } = useAuthContext();
  const { updateMenuName } = useTodoMenuContext();

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
  const handleEdit = () => {
    setIsEditing(true);
    setEditingValue(menu.text);
  };

  const handleSave = async () => {
    if (!user?.id || editingValue.trim() === menu.text.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      await updateMenuName(menu.id as number, editingValue.trim(), user.id, menu.type);
      setIsEditing(false);
    } catch (error) {
      menuLogger.error("이름 변경 실패", { error });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  if (menu.type === "list") {
    const isActive = activeListId === String(menu.id);

    if (isEditing) {
      return (
        <div className="px-3 py-2">
          <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      );
    }

    return (
      <SimpleDropdown
        triggerType="contextmenu"
        menuItems={[
          {
            label: "이름 변경",
            icon: <Edit3 className="w-4 h-4" />,
            onClick: handleEdit,
          },
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

  if (isEditing) {
    return (
      <div className="px-3 py-2">
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
    );
  }

  return (
    <SimpleDropdown
      triggerType="contextmenu"
      menuItems={[
        {
          label: "이름 변경",
          icon: <Edit3 className="w-4 h-4" />,
          onClick: handleEdit,
        },
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
