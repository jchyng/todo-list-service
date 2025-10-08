import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import type { TodoItem } from "@/types/todoItem";
import { todoLogger } from "@/lib/logger";

/**
 * Edge Function을 통한 할 일 순서 변경
 */
async function callTodoMoveEdgeFunction(
  itemId: number,
  payload: Record<string, any>
): Promise<ServiceResult<TodoItem>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/todo-move` : '/functions/v1/todo-move';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        item_id: itemId,
        ...payload,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "서버 오류가 발생했습니다" };
    }

    return { success: true, data: result.data as TodoItem };
  } catch (error) {
    todoLogger.error('Edge function call error', { error, itemId, payload });
    return { success: false, error: "네트워크 오류가 발생했습니다" };
  }
}

/**
 * 할 일 순서 변경 (position 직접 지정)
 */
export async function reorderTodoItem(
  _userId: string,
  itemId: number,
  newPosition: string
): Promise<ServiceResult<TodoItem>> {
  return callTodoMoveEdgeFunction(itemId, { target_position: newPosition });
}

/**
 * 할 일을 두 아이템 사이로 이동
 */
export async function moveTodoItemBetween(
  _userId: string,
  itemId: number,
  beforeItemId?: number,
  afterItemId?: number
): Promise<ServiceResult<TodoItem>> {
  return callTodoMoveEdgeFunction(itemId, {
    before_item_id: beforeItemId,
    after_item_id: afterItemId,
  });
}
