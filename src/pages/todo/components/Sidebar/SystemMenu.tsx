import { Link } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import BaseMenuItem from "./BaseMenu";

interface SystemMenuProps {
  icon: LucideIcon;
  text: string;
  count: number;
  virtualId: string;
  isActive?: boolean;
}

export default function SystemMenu({
  icon: Icon,
  text,
  count = 0,
  virtualId,
  isActive = false,
}: SystemMenuProps) {
  return (
    <Link to={`/todo/${virtualId}`} className="block">
      <BaseMenuItem
        icon={<Icon className="w-4 h-4" />}
        text={text}
        rightContent={<span className="text-muted-foreground">{count}</span>}
        className={isActive ? "bg-accent text-accent-foreground border-l-4 border-blue-500" : ""}
      />
    </Link>
  );
}
