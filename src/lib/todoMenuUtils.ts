import type { UserMenuProps, ListMenuProps } from "@/data/SidebarMenuData";
import { getRandomColor } from "@/constant/TailwindColor";

export const generateTempId = (prefix: string): string => {
  return `temp-${prefix}-${Date.now()}`;
};

export const createOptimisticGroup = (id: string, name: string): UserMenuProps => ({
  id: id as any,
  text: name,
  type: "group",
  children: [],
  isTemp: true,
  isPending: false,
});

export const createOptimisticList = (
  id: string,
  name: string,
  color?: string
): UserMenuProps => ({
  id: id as any,
  text: name,
  type: "list",
  color: color || getRandomColor(),
  count: 0,
  isTemp: true,
  isPending: false,
});

export const transformGroupToUserMenu = (group: any, children: any[] = []): UserMenuProps => ({
  id: group.id,
  text: group.name,
  type: "group",
  position: group.position,
  children: children.map(list => transformListToListMenu(list)),
});

export const transformListToUserMenu = (list: any): UserMenuProps => ({
  id: list.id,
  text: list.name,
  type: "list",
  color: list.color,
  count: 0,
  position: list.position,
});

export const transformListToListMenu = (list: any): ListMenuProps => ({
  id: list.id,
  text: list.name,
  type: "list",
  color: list.color,
  count: 0,
});

export const transformMenuData = (
  groups: any[],
  independentLists: any[],
  groupLists: any[]
): UserMenuProps[] => {
  const result: UserMenuProps[] = [];

  groups.forEach(group => {
    const childLists = groupLists.filter(list => list.group_id === group.id);
    result.push(transformGroupToUserMenu(group, childLists));
  });

  independentLists.forEach(list => {
    result.push(transformListToUserMenu(list));
  });

  return result;
};

const createGroupFromRpcData = (item: any): UserMenuProps => ({
  id: item.id,
  text: item.name,
  type: "group",
  position: item.position,
  children: [],
});

const createListFromRpcData = (item: any): UserMenuProps => ({
  id: item.id,
  text: item.name,
  type: "list",
  color: item.color,
  count: 0,
  position: item.position,
});

const addListToGroup = (list: any, groupsMap: Map<number, UserMenuProps>) => {
  const parentGroup = groupsMap.get(list.parent_id);
  if (parentGroup?.children) {
    parentGroup.children.push({
      id: list.id,
      text: list.name,
      type: "list",
      color: list.color,
      count: 0,
    });
  }
};

export const transformRpcMenuData = (rpcData: any[]): UserMenuProps[] => {
  const result: UserMenuProps[] = [];
  const groupsMap = new Map<number, UserMenuProps>();

  rpcData.forEach(item => {
    if (item.type === 'group') {
      const group = createGroupFromRpcData(item);
      groupsMap.set(item.id, group);
      result.push(group);
    } else if (item.type === 'list') {
      if (item.parent_id) {
        addListToGroup(item, groupsMap);
      } else {
        result.push(createListFromRpcData(item));
      }
    }
  });

  return result;
};