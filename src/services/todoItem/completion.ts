import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import type { TodoItem } from "@/types/todoItem";
import { updateTodoItem } from "./crud";
import { addRecurrenceException } from "../recurrence";
import { todoLogger } from "@/lib/logger";

/**
 * 할 일 완료 상태 토글
 */
export async function toggleTodoCompletion(
  _userId: string,
  itemId: number,
  isCompleted: boolean
): Promise<ServiceResult<TodoItem>> {
  try {
    // 1. 기본 완료 상태 업데이트
    const updateResult = await updateTodoItem(_userId, itemId, { is_completed: isCompleted });

    if (!updateResult.success) {
      return updateResult;
    }

    const updatedItem = updateResult.data;

    // 2. 반복 작업이 완료된 경우 다음 인스턴스 생성
    if (isCompleted && updatedItem && updatedItem.recurrence_id) {
      try {
        const { data: nextTaskResult, error: rpcError } = await supabase.rpc(
          'create_next_recurring_task',
          { original_item_id: itemId }
        );

        if (rpcError) {
          todoLogger.error('Failed to create next recurring task', { error: rpcError });
        } else if (nextTaskResult?.success) {
          todoLogger.success('Successfully created next recurring task', { data: nextTaskResult.data });
        }
      } catch (error) {
        todoLogger.error('Error creating next recurring task', { error });
      }
    }

    return updateResult;
  } catch (error) {
    todoLogger.error('Toggle todo completion error', { error });
    return { success: false, error: "완료 상태 변경 중 오류가 발생했습니다" };
  }
}

/**
 * 반복 할 일에서 특정 인스턴스 삭제
 */
export async function deleteRecurringInstance(
  _userId: string,
  itemId: number
): Promise<ServiceResult> {
  try {
    // 1. 해당 작업 정보 조회
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("recurrence_id, due_date")
      .eq("id", itemId)
      .eq("user_id", _userId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    // 2. 반복 작업인 경우 예외 날짜로 기록
    if (item.recurrence_id && item.due_date) {
      const exceptionResult = await addRecurrenceException(
        item.recurrence_id,
        item.due_date,
        'deleted'
      );

      if (!exceptionResult.success) {
        todoLogger.error('Failed to add recurrence exception', { error: exceptionResult.error });
      }
    }

    // 3. 작업 삭제
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", _userId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (error) {
    todoLogger.error('Delete recurring instance error', { error });
    return { success: false, error: "반복 할 일 삭제 중 오류가 발생했습니다" };
  }
}
