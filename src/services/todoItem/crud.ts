import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";
import type { TodoItem, CreateTodoItemData, UpdateTodoItemData } from "@/types/todoItem";
import { createRecurrenceRule, updateRecurrenceRule, deleteRecurrenceRule, deactivateRecurrenceRule } from "../recurrence";
import { fetchRecurrenceConfig, enrichItemsWithRecurrence, generateNewPosition } from "./utils";
import { todoLogger } from "@/lib/logger";

/**
 * 할 일 생성
 */
export async function createTodoItem(
  _userId: string,
  data: CreateTodoItemData
): Promise<ServiceResult<TodoItem>> {
  try {
    let recurrenceId: number | undefined;

    // 반복 설정이 있으면 recurrence_rule 먼저 생성
    if (data.repeat_config && data.repeat_config.type !== 'none') {
      const recurrenceResult = await createRecurrenceRule(data.repeat_config);
      if (!recurrenceResult.success) {
        return { success: false, error: recurrenceResult.error };
      }
      recurrenceId = recurrenceResult.data?.id;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const newPosition = await generateNewPosition();

    const insertData: any = {
      user_id: _userId,
      list_id: data.list_id,
      title: data.title,
      description: data.description,
      is_important: data.is_important || false,
      due_date: data.due_date,
      position: newPosition,
      is_completed: false,
    };

    if (recurrenceId) {
      insertData.recurrence_id = recurrenceId;
    }

    const { data: item, error } = await supabase
      .from("todo_items")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      // recurrence_rule을 생성했다면 롤백
      if (recurrenceId) {
        await deleteRecurrenceRule(recurrenceId);
      }
      return handleServiceError<TodoItem>(error);
    }

    // 반복 설정 정보를 추가하여 반환
    const result: TodoItem = {
      ...item,
      repeat_config: data.repeat_config,
    };

    return { success: true, data: result };
  } catch (error) {
    todoLogger.error('Create todo item error', { error });
    return { success: false, error: "할 일 생성 중 오류가 발생했습니다" };
  }
}

/**
 * 할 일 목록 조회
 */
export async function getTodoItems(
  _userId: string,
  listId: number
): Promise<ServiceResult<TodoItem[]>> {
  try {
    const { data, error } = await supabase
      .from("todo_items")
      .select("*")
      .eq("user_id", _userId)
      .eq("list_id", listId)
      .order("position");

    if (error) {
      todoLogger.error('getTodoItems query failed', { error, userId: _userId, listId });
      return handleServiceError<TodoItem[]>(error);
    }

    const enrichedData = await enrichItemsWithRecurrence(data || []);
    return { success: true, data: enrichedData };
  } catch (error) {
    todoLogger.error('Get todo items error', { error });
    return { success: false, error: "할 일 목록 조회 중 오류가 발생했습니다" };
  }
}

interface TodoItemUpdatePayload extends UpdateTodoItemData {
  completed_at?: string | null;
}

/**
 * 할 일 업데이트
 */
export async function updateTodoItem(
  _userId: string,
  itemId: number,
  data: UpdateTodoItemData
): Promise<ServiceResult<TodoItem>> {
  try {
    const updateData: TodoItemUpdatePayload = {
      ...data,
    };

    // 완료 상태가 변경될 때 completed_at 설정
    if (data.is_completed !== undefined) {
      updateData.completed_at = data.is_completed ? new Date().toISOString() : null;
    }

    // 기존 아이템 정보 조회 (반복 설정 포함)
    const { data: existingItem, error: fetchError } = await supabase
      .from("todo_items")
      .select("recurrence_id, list_id")
      .eq("id", itemId)
      .eq("user_id", _userId)
      .single();

    if (fetchError) return handleServiceError<TodoItem>(fetchError);

    // 반복 설정 처리
    if (data.repeat_config !== undefined) {
      if (data.repeat_config === null || data.repeat_config.type === 'none') {
        // 반복 제거: recurrence_rule 비활성화
        if (existingItem.recurrence_id) {
          // is_active를 false로 설정하여 비활성화 (삭제하지 않음)
          const deactivateResult = await deactivateRecurrenceRule(existingItem.recurrence_id);
          if (!deactivateResult.success) {
            return { success: false, error: deactivateResult.error };
          }
          // recurrence_id는 유지 (이전 기록들과의 연결 유지)
        }
      } else {
        // 반복 설정 추가/변경
        if (existingItem.recurrence_id) {
          // 기존 규칙 업데이트
          const updateResult = await updateRecurrenceRule(existingItem.recurrence_id, data.repeat_config);
          if (!updateResult.success) {
            return { success: false, error: updateResult.error };
          }
        } else {
          // 새 규칙 생성
          const createResult = await createRecurrenceRule(data.repeat_config);
          if (!createResult.success) {
            return { success: false, error: createResult.error };
          }
          updateData.recurrence_id = createResult.data?.id;
        }
      }

      // repeat_config는 UI용이므로 DB 업데이트에서 제외
      delete updateData.repeat_config;
    }

    // 아이템 업데이트
    const { error: updateError } = await supabase
      .from("todo_items")
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", _userId);

    if (updateError) return handleServiceError(updateError);

    // 업데이트 후 아이템 조회
    const { data: item, error: selectError } = await supabase
      .from("todo_items")
      .select("*")
      .eq("id", itemId)
      .eq("user_id", _userId)
      .single();

    if (selectError) return handleServiceError(selectError);

    // 반복 설정이 있으면 별도로 조회
    let repeat_config;
    let recurrence_rule;
    if (item.recurrence_id) {
      const { repeat_config: rc, recurrence_rule: rr } = await fetchRecurrenceConfig(item.recurrence_id);
      repeat_config = rc;
      recurrence_rule = rr;
    }

    const parsedItem: TodoItem = {
      ...item,
      repeat_config,
      recurrence_rule,
    };

    return { success: true, data: parsedItem };
  } catch (error) {
    todoLogger.error('Update todo item error', { error });
    return { success: false, error: "할 일 업데이트 중 오류가 발생했습니다" };
  }
}

/**
 * 할 일 삭제
 */
export async function deleteTodoItem(
  _userId: string,
  itemId: number
): Promise<ServiceResult> {
  try {
    const { error: deleteError } = await supabase
      .from("todo_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", _userId);

    if (deleteError) return handleServiceError(deleteError);
    return { success: true };
  } catch (error) {
    todoLogger.error('Delete todo item error', { error });
    return { success: false, error: "할 일 삭제 중 오류가 발생했습니다" };
  }
}

/**
 * 할 일 복사
 */
export async function duplicateTodoItem(
  _userId: string,
  itemId: number
): Promise<ServiceResult<TodoItem>> {
  const { data: originalItem, error: fetchError } = await supabase
    .from("todo_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", _userId)
    .single();

  if (fetchError) return handleServiceError(fetchError);

  const duplicateData: CreateTodoItemData = {
    list_id: originalItem.list_id,
    title: `${originalItem.title} 복사본`,
    description: originalItem.description,
  };

  return createTodoItem(_userId, duplicateData);
}
