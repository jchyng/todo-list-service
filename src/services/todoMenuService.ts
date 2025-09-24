import type { TailwindColor } from "@/constant/TailwindColor";
import { supabase } from "@/lib/supabase";

type ServiceResult<T = any> = { success: true; data?: T } | { success: false; error: string };

const handleServiceError = (error: any): ServiceResult => ({
  success: false,
  error: error?.message || "Unknown error occurred"
});

export async function createGroup(
  userId: string,
  name: string,
  index?: number
): Promise<ServiceResult> {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      user_id: userId,
      name,
    })
    .select()
    .single();

  if (groupError) return handleServiceError(groupError);

  const { error: positionError } = await supabase.rpc(
    "add_menu_item_at_index",
    {
      p_user_id: userId,
      p_item_type: "group",
      p_item_id: group.id,
      p_index: index || null,
    }
  );

  if (positionError) return handleServiceError(positionError);

  return { success: true, data: group };
}

export async function createList(
  userId: string,
  name: string,
  color: TailwindColor | null = null,
  groupId: number | null = null,
  index?: number
): Promise<ServiceResult> {
  const { data: list, error: listError } = await supabase
    .from("lists")
    .insert({
      user_id: userId,
      group_id: groupId,
      color,
      name,
      is_system: false,
    })
    .select()
    .single();

  if (listError) return handleServiceError(listError);

  const { error: positionError } = await supabase.rpc(
    "add_menu_item_at_index",
    {
      p_user_id: userId,
      p_item_type: "list",
      p_item_id: list.id,
      p_index: index || null,
    }
  );

  if (positionError) return handleServiceError(positionError);

  return { success: true, data: list };
}

export async function createSystemList(
  userId: string,
  name: string,
  color: TailwindColor | null = null
): Promise<ServiceResult> {
  const { data, error } = await supabase
    .from("lists")
    .insert({
      user_id: userId,
      name,
      color,
      is_system: true,
    })
    .select()
    .single();

  if (error) return handleServiceError(error);
  return { success: true, data };
}

export async function createDefaultSystemList(userId: string): Promise<ServiceResult> {
  return createSystemList(userId, "작업");
}

export async function moveMenuItem(
  userId: string,
  itemType: "group" | "list",
  itemId: number,
  newIndex: number
): Promise<ServiceResult> {
  const { error } = await supabase.rpc("move_menu_item_to_index", {
    p_user_id: userId,
    p_item_type: itemType,
    p_item_id: itemId,
    p_index: newIndex,
  });

  if (error) return handleServiceError(error);
  return { success: true };
}

export async function deleteList(userId: string, listId: number): Promise<ServiceResult> {
  const { error } = await supabase
    .from("lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) return handleServiceError(error);
  return { success: true };
}

const updateListsToIndependent = async (userId: string, groupId: number) => {
  const { data, error } = await supabase
    .from("lists")
    .update({ group_id: null })
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .select("id");

  if (error) throw new Error(error.message);
  return data || [];
};

const addListsToMenu = async (userId: string, lists: any[]) => {
  for (const list of lists) {
    await supabase.rpc("add_menu_item_at_index", {
      p_user_id: userId,
      p_item_type: "list",
      p_item_id: list.id,
      p_index: null,
    });
  }
};

const deleteGroupById = async (userId: string, groupId: number) => {
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
};

export async function dissolveGroup(userId: string, groupId: number): Promise<ServiceResult> {
  try {
    const updatedLists = await updateListsToIndependent(userId, groupId);

    if (updatedLists.length > 0) {
      await addListsToMenu(userId, updatedLists);
    }

    await deleteGroupById(userId, groupId);

    return { success: true, data: { updatedLists: updatedLists.length } };
  } catch (error) {
    return handleServiceError(error);
  }
}

export async function getUserMenus(userId: string): Promise<ServiceResult> {
  const { data, error } = await supabase.rpc("get_user_menus_with_positions", {
    p_user_id: userId,
  });

  if (error) return handleServiceError(error);
  return { success: true, data: data || [] };
}
