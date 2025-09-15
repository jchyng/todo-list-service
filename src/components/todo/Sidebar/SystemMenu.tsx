import { type LucideIcon } from "lucide-react";
import BaseMenuItem from "./BaseMenu";

interface SystemMenuProps {
  icon: LucideIcon;
  text: string;
  count: number;
}

export default function SystemMenu({
  icon: Icon,
  text,
  count = 0,
}: SystemMenuProps) {
  return (
    <BaseMenuItem
      icon={<Icon className="w-4 h-4" />}
      text={text}
      rightContent={<span className="text-muted-foreground">{count}</span>}
    />
  );
}
