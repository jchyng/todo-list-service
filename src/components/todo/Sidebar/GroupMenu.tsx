import { ChevronDown, ChevronRight, Inbox } from "lucide-react";
import ListMenu from "./ListMenu";
import BaseMenu from "./BaseMenu";
import type { ListMenuProps } from "@/data/SidebarMenuData";

interface GroupMenuProps {
  text: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: ListMenuProps[];
}

const GroupMenu: React.FC<GroupMenuProps> = ({
  text,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div>
      <BaseMenu
        icon={<Inbox className="w-4 h-4 text-gray-500" />}
        text={text}
        rightContent={
          isOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )
        }
        onClick={onToggle}
      />

      {isOpen && children && (
        <div className="ml-6 border-l border-gray-300">
          {children.map((child) => (
            <div key={child.id}>
              <ListMenu
                dotSize={2}
                dotColor={child.color}
                text={child.text}
                count={child.count || 0}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupMenu;
