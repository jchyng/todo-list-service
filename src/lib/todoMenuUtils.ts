import type { UserMenuProps, ListMenuProps } from "@/data/SidebarMenuData";
import { getRandomColor } from "@/constant/TailwindColor";

// Database entity interfaces
interface GroupEntity {
  id: number;
  name: string;
  position?: string;
}

interface ListEntity {
  id: number;
  name: string;
  color: string;
  position?: string;
  group_id?: number;
}

// RPC data interfaces
interface RpcMenuItem {
  id: number;
  name: string;
  type: 'group' | 'list';
  color?: string;
  position: string;
  parent_id?: number;
  item_count?: number;
}

export const generateTempId = (prefix: string): string => {
  return `temp-${prefix}-${Date.now()}`;
};

export const createOptimisticGroup = (id: string, name: string): UserMenuProps => ({
  id: id as string | number,
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
  id: id as string | number,
  text: name,
  type: "list",
  color: color || getRandomColor(),
  count: 0,
  isTemp: true,
  isPending: false,
});

export const transformGroupToUserMenu = (group: GroupEntity, children: ListEntity[] = []): UserMenuProps => ({
  id: group.id,
  text: group.name,
  type: "group",
  position: group.position,
  children: children.map(list => transformListToListMenu(list)),
});

export const transformListToUserMenu = (list: ListEntity): UserMenuProps => ({
  id: list.id,
  text: list.name,
  type: "list",
  color: list.color,
  count: 0,
  position: list.position,
});

export const transformListToListMenu = (list: ListEntity): ListMenuProps => ({
  id: list.id,
  text: list.name,
  type: "list",
  color: list.color,
  count: 0,
});

export const transformMenuData = (
  groups: GroupEntity[],
  independentLists: ListEntity[],
  groupLists: ListEntity[]
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

const createGroupFromRpcData = (item: RpcMenuItem): UserMenuProps => ({
  id: item.id,
  text: item.name,
  type: "group",
  position: item.position,
  children: [],
});

const createListFromRpcData = (item: RpcMenuItem): UserMenuProps => ({
  id: item.id,
  text: item.name,
  type: "list",
  color: item.color || '#gray',
  count: item.item_count || 0,
  position: item.position,
});

const addListToGroup = (list: RpcMenuItem, groupsMap: Map<number, UserMenuProps>) => {
  if (!list.parent_id) return;
  const parentGroup = groupsMap.get(list.parent_id);
  if (parentGroup?.children) {
    parentGroup.children.push({
      id: list.id,
      text: list.name,
      type: "list",
      color: list.color || '#gray',
      count: list.item_count || 0,
    });
  }
};

export const transformRpcMenuData = (rpcData: RpcMenuItem[]): UserMenuProps[] => {
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