import { CheckSquare, Star, Sun, type LucideIcon } from "lucide-react";

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
}

export interface UserMenuProps {
  //group or list
  id: number;
  text: string;
  type: "group" | "list";
  color?: string;
  count?: number;
  children?: ListMenuProps[];
}

export const userMenus: UserMenuProps[] = [
  {
    id: 1,
    text: "Work",
    type: "group",
    children: [
      {
        id: 2,
        text: "Frontend",
        type: "list",
        color: "purple",
        count: 2,
      },
      {
        id: 3,
        text: "Backend",
        type: "list",
        color: "yellow",
        count: 2,
      },
    ],
  },
  {
    id: 4,
    text: "Personal",
    type: "group",
    children: [
      {
        id: 5,
        text: "Shopping",
        type: "list",
        color: "amber",
        count: 1,
      },
    ],
  },
  {
    id: 6,
    text: "Inbox",
    type: "list",
    color: "gray",
    count: 0,
  },
];
