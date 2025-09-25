import { CheckSquare, Star, Sun, type LucideIcon } from "lucide-react";
import type { OptimisticItem } from "@/lib/types";

interface SystemMenuProps {
  id: number;
  text: string;
  count: number;
  type: "system";
  order: 1 | 2 | 3;
  icon: LucideIcon;
}

export const systemMenus: SystemMenuProps[] = [
  { id: 1, text: "오늘 할 일", count: 5, type: "system", icon: Sun, order: 1 },
  { id: 2, text: "중요", count: 3, type: "system", icon: Star, order: 2 },
  {
    id: 3,
    text: "작업",
    count: 8,
    type: "system",
    icon: CheckSquare,
    order: 3,
  },
];

export interface ListMenuProps {
  id: number;
  text: string;
  type: "list";
  color: string;
  count: number;
  isPending?: boolean;
}

export interface UserMenuProps extends OptimisticItem {
  //group or list
  text: string;
  type: "group" | "list";
  color?: string;
  count?: number;
  position?: string;
  children?: ListMenuProps[];
}

// 정적 userMenus 배열 제거됨 - 실제 DB 데이터로 대체
// UserMenuProps 타입은 유지
