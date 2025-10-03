import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";
import type { TodoItem, CreateTodoItemData, UpdateTodoItemData } from "@/types/todoItem";
import {
  createRecurrenceRule,
  updateRecurrenceRule,
  deleteRecurrenceRule,
  convertRecurrenceRuleToRepeatConfig,
  addRecurrenceException
} from "./recurrenceRuleService";
import { todoLogger } from "@/lib/logger";

/**
 * 반복 설정 조회 및 변환 유틸 함수
 */
async function fetchRecurrenceConfig(recurrenceId: number) {
  try {
    const { data: ruleData, error } = await supabase
      .from("recurrence_rule")
      .select("*")
      .eq("id", recurrenceId)
      .single();

    if (error || !ruleData) {
      todoLogger.warn('Failed to fetch recurrence rule', { error, recurrenceId });
      return { repeat_config: undefined, recurrence_rule: undefined };
    }

    return {
      repeat_config: convertRecurrenceRuleToRepeatConfig(ruleData),
      recurrence_rule: ruleData
    };
  } catch (error) {
    todoLogger.warn('Error fetching recurrence rule', { error, recurrenceId });
    return { repeat_config: undefined, recurrence_rule: undefined };
  }
}

/**
 * TodoItem 배열에 반복 설정 추가
 */
async function enrichItemsWithRecurrence(items: any[]): Promise<TodoItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (!item.recurrence_id) {
        return { ...item, repeat_config: undefined, recurrence_rule: undefined };
      }

      const { repeat_config, recurrence_rule } = await fetchRecurrenceConfig(item.recurrence_id);
      return { ...item, repeat_config, recurrence_rule };
    })
  );
}

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
      recurrenceId = recurrenceResult.data.id;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "인증이 필요합니다" };
    }

    // Edge Function 사용하는 대신 직접 DB에 삽입
    // position 계산을 위해 generate_position_between 함수 사용
    const { data: positionResult } = await supabase.rpc('generate_position_between', {
      p_before: null,
      p_after: null
    });

    const newPosition = positionResult || 'n';

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
      .from("items")
      .insert(insertData)
      .select("*")
      .single();

    if (error) {
      // recurrence_rule을 생성했다면 롤백
      if (recurrenceId) {
        await deleteRecurrenceRule(recurrenceId);
      }
      return handleServiceError(error);
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

export async function getTodoItems(
  _userId: string,
  listId: number
): Promise<ServiceResult<TodoItem[]>> {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", _userId)
      .eq("list_id", listId)
      .order("position");

    if (error) {
      todoLogger.error('getTodoItems query failed', { error, userId: _userId, listId });
      return handleServiceError(error);
    }

    const enrichedData = await enrichItemsWithRecurrence(data || []);
    return { success: true, data: enrichedData };
  } catch (error) {
    todoLogger.error('Get todo items error', { error });
    return { success: false, error: "할 일 목록 조회 중 오류가 발생했습니다" };
  }
}

interface TodoItemUpdatePayload extends UpdateTodoItemData {
  updated_at: string;
  completed_at?: string | null;
}

export async function updateTodoItem(
  _userId: string,
  itemId: number,
  data: UpdateTodoItemData
): Promise<ServiceResult<TodoItem>> {
  try {
    const updateData: TodoItemUpdatePayload = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    // 완료 상태가 변경될 때 completed_at 설정
    if (data.is_completed !== undefined) {
      updateData.completed_at = data.is_completed ? new Date().toISOString() : null;
    }

    // 기존 아이템 정보 조회 (반복 설정 포함)
    const { data: existingItem, error: fetchError } = await supabase
      .from("items")
      .select("recurrence_id, list_id")
      .eq("id", itemId)
      .eq("user_id", _userId)
      .single();

    if (fetchError) return handleServiceError(fetchError);

    // 반복 설정 처리
    if (data.repeat_config !== undefined) {
      if (data.repeat_config === null || data.repeat_config.type === 'none') {
        // 반복 제거: recurrence_id만 NULL로 설정 (CASCADE 방지)
        if (existingItem.recurrence_id) {
          updateData.recurrence_id = null;
          // recurrence_rule은 나중에 정리 (다른 items가 참조할 수도 있음)
          // 백그라운드 작업으로 미사용 recurrence_rule 정리 가능
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
          updateData.recurrence_id = createResult.data.id;
        }
      }

      // repeat_config는 UI용이므로 DB 업데이트에서 제외
      delete updateData.repeat_config;
    }

    // 아이템 업데이트 (JOIN 없이)
    const { data: item, error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", _userId)
      .select()
      .single();

    if (error) return handleServiceError(error);

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

export async function deleteTodoItem(
  _userId: string,
  itemId: number
): Promise<ServiceResult> {
  try {
    // 1. 해당 작업 정보 조회 (반복 정보 포함)
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("recurrence_id, due_date")
      .eq("id", itemId)
      .eq("user_id", _userId)
      .single();

    if (fetchError) return handleServiceError(fetchError);

    // 2. 반복 작업인 경우 예외 날짜로 기록
    if (item.recurrence_id && item.due_date) {
      const exceptionResult = await addRecurrenceException(
        item.recurrence_id,
        item.due_date,
        'deleted'
      );

      if (!exceptionResult.success) {
        todoLogger.error('Failed to add recurrence exception', { error: exceptionResult.error });
        // 예외 기록 실패해도 삭제는 계속 진행
      }
    }

    // 3. 작업 삭제
    const { error: deleteError } = await supabase
      .from("items")
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
    if (isCompleted && updatedItem.recurrence_id) {
      try {
        // SQL 함수 호출로 다음 반복 작업 생성
        const { data: nextTaskResult, error: rpcError } = await supabase.rpc(
          'create_next_recurring_task',
          { original_item_id: itemId }
        );

        if (rpcError) {
          todoLogger.error('Failed to create next recurring task', { error: rpcError });
          // 다음 작업 생성 실패해도 현재 완료는 유지
        } else if (nextTaskResult?.success) {
          todoLogger.success('Successfully created next recurring task', { data: nextTaskResult.data });
        }
      } catch (error) {
        todoLogger.error('Error creating next recurring task', { error });
        // 에러가 발생해도 현재 완료 상태는 유지
      }
    }

    return updateResult;
  } catch (error) {
    todoLogger.error('Toggle todo completion error', { error });
    return { success: false, error: "완료 상태 변경 중 오류가 발생했습니다" };
  }
}

export async function reorderTodoItem(
  _userId: string,
  itemId: number,
  newPosition: string
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
        target_position: newPosition,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "서버 오류가 발생했습니다" };
    }

    return { success: true, data: result.data as TodoItem };
  } catch (error) {
    todoLogger.error('Reorder todo item error', { error });
    return { success: false, error: "네트워크 오류가 발생했습니다" };
  }
}

export async function moveTodoItemBetween(
  _userId: string,
  itemId: number,
  beforeItemId?: number,
  afterItemId?: number
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
        before_item_id: beforeItemId,
        after_item_id: afterItemId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || "서버 오류가 발생했습니다" };
    }

    return { success: true, data: result.data as TodoItem };
  } catch (error) {
    todoLogger.error('Move todo item between error', { error });
    return { success: false, error: "네트워크 오류가 발생했습니다" };
  }
}

export async function duplicateTodoItem(
  _userId: string,
  itemId: number
): Promise<ServiceResult<TodoItem>> {
  // 원본 아이템 조회
  const { data: originalItem, error: fetchError } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", _userId)
    .single();

  if (fetchError) return handleServiceError(fetchError);

  // 새 아이템 생성 (제목에 "복사본" 추가)
  const duplicateData: CreateTodoItemData = {
    list_id: originalItem.list_id,
    title: `${originalItem.title} 복사본`,
    description: originalItem.description,
  };

  return createTodoItem(_userId, duplicateData);
}