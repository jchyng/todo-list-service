import { ChevronDown, ChevronRight, Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import ListMenu from "./ListMenu";
import BaseMenu from "./BaseMenu";
import type { ListMenuProps } from "@/data/SidebarMenuData";

interface GroupMenuProps {
  text: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: ListMenuProps[];
  isPending?: boolean;
  activeListId?: string;
}

const GroupMenu: React.FC<GroupMenuProps> = ({
  text,
  isOpen,
  onToggle,
  children,
  isPending = false,
  activeListId,
}) => {
  return (
    <div>
      <BaseMenu
        icon={<Inbox className="w-4 h-4 text-gray-500" />}
        text={text}
        onClick={onToggle}
        rightContent={
          <>
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </>
        }
        className={isPending ? "opacity-50 transition-opacity duration-200" : ""}
      />

      {isOpen && children && (
        <div className="ml-6 border-l border-gray-300">
          {children.map((child) => {
            const isActive = activeListId === String(child.id);

            return (
              <div key={child.id}>
                <Link to={`/todo/${child.id}`} className="block">
                  <ListMenu
                    dotSize={2}
                    dotColor={child.color}
                    text={child.text}
                    count={child.count || 0}
                    isPending={child.isPending}
                    isActive={isActive}
                  />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupMenu;
