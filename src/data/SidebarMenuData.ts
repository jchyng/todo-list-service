import { CheckSquare, Star, Sun, type LucideIcon } from "lucide-react";
import type { OptimisticItem } from "@/lib/types";

export interface SystemMenuProps {
  id: number;
  virtualId: string; // 가상 ID for routing
  text: string;
  count: number;
  type: "system";
  order: 1 | 2 | 3;
  icon: LucideIcon;
  isVirtual: boolean; // 실제 list 테이블에 있는지 여부
}

export const systemMenus: SystemMenuProps[] = [
  {
    id: 1,
    virtualId: "today",
    text: "오늘 할 일",
    count: 5,
    type: "system",
    icon: Sun,
    order: 1,
    isVirtual: true
  },
  {
    id: 2,
    virtualId: "important",
    text: "중요",
    count: 3,
    type: "system",
    icon: Star,
    order: 2,
    isVirtual: true
  },
  {
    id: 3,
    virtualId: "tasks",
    text: "작업",
    count: 8,
    type: "system",
    icon: CheckSquare,
    order: 3,
    isVirtual: false // 실제 list 테이블에 존재
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
