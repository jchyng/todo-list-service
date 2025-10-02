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
      after_position: null,
      before_position: null
    });

    const newPosition = positionResult || 'a0';

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
    console.error('Create todo item error:', error);
    return { success: false, error: "할 일 생성 중 오류가 발생했습니다" };
  }
}

export async function getTodoItems(
  _userId: string,
  listId: number
): Promise<ServiceResult<TodoItem[]>> {
  try {
    // 먼저 기본 items 조회 시도
    let data, error;

    try {
      // recurrence_rule과 JOIN 시도
      const joinResult = await supabase
        .from("items")
        .select(`
          *,
          recurrence_rule (*)
        `)
        .eq("user_id", _userId)
        .eq("list_id", listId)
        .order("position");

      data = joinResult.data;
      error = joinResult.error;
    } catch (joinError) {
      console.warn('JOIN query failed, falling back to basic query:', joinError);

      // JOIN 실패 시 기본 쿼리로 fallback
      const basicResult = await supabase
        .from("items")
        .select("*")
        .eq("user_id", _userId)
        .eq("list_id", listId)
        .order("position");

      data = basicResult.data;
      error = basicResult.error;
    }

    if (error) {
      console.error('getTodoItems query failed:', {
        error,
        userId: _userId,
        listId,
        query: 'items query (with fallback)'
      });
      return handleServiceError(error);
    }

    // 반복 설정을 UI 형태로 변환
    const parsedData = await Promise.all(
      (data || []).map(async (item) => {
        let repeat_config;
        let recurrence_rule;

        // recurrence_id가 있으면 별도로 조회
        if (item.recurrence_id) {
          try {
            const ruleResult = await supabase
              .from("recurrence_rule")
              .select("*")
              .eq("id", item.recurrence_id)
              .single();

            if (ruleResult.data) {
              recurrence_rule = ruleResult.data;
              repeat_config = convertRecurrenceRuleToRepeatConfig(ruleResult.data);
            }
          } catch (ruleError) {
            console.warn('Failed to fetch recurrence rule:', ruleError);
          }
        }

        return {
          ...item,
          repeat_config,
          recurrence_rule,
        };
      })
    );

    return { success: true, data: parsedData };
  } catch (error) {
    console.error('Get todo items error:', error);
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
      .select("recurrence_id")
      .eq("id", itemId)
      .eq("user_id", _userId)
      .single();

    if (fetchError) return handleServiceError(fetchError);

    // 반복 설정 처리
    if (data.repeat_config !== undefined) {
      if (data.repeat_config === null || data.repeat_config.type === 'none') {
        // 반복 제거: 기존 recurrence_rule 삭제
        if (existingItem.recurrence_id) {
          await deleteRecurrenceRule(existingItem.recurrence_id);
          updateData.recurrence_id = null;
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

    // 아이템 업데이트
    const { data: item, error } = await supabase
      .from("items")
      .update(updateData)
      .eq("id", itemId)
      .eq("user_id", _userId)
      .select(`
        *,
        recurrence_rule!left (*)
      `)
      .single();

    if (error) return handleServiceError(error);

    // 반복 설정을 UI 형태로 변환
    let repeat_config;
    if (item.recurrence_rule) {
      repeat_config = convertRecurrenceRuleToRepeatConfig(item.recurrence_rule);
    }

    const parsedItem: TodoItem = {
      ...item,
      repeat_config,
      recurrence_rule: item.recurrence_rule,
    };

    return { success: true, data: parsedItem };
  } catch (error) {
    console.error('Update todo item error:', error);
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
        console.error('Failed to add recurrence exception:', exceptionResult.error);
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
    console.error('Delete todo item error:', error);
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
          console.error('Failed to create next recurring task:', rpcError);
          // 다음 작업 생성 실패해도 현재 완료는 유지
        } else if (nextTaskResult?.success) {
          console.log('Successfully created next recurring task:', nextTaskResult.data);
        }
      } catch (error) {
        console.error('Error creating next recurring task:', error);
        // 에러가 발생해도 현재 완료 상태는 유지
      }
    }

    return updateResult;
  } catch (error) {
    console.error('Toggle todo completion error:', error);
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
    console.error('Reorder todo item error:', error);
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
    console.error('Move todo item between error:', error);
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

// System Menu용 함수들

/**
 * 오늘 할 일 조회 (added_to_my_day_date가 오늘인 작업)
 */
export async function getTodayTodoItems(
  _userId: string
): Promise<ServiceResult<TodoItem[]>> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", _userId)
      .eq("added_to_my_day_date", today)
      .order("position");

    if (error) {
      console.error('getTodayTodoItems query failed:', error);
      return handleServiceError(error);
    }

    // 반복 설정을 UI 형태로 변환
    const parsedData = await Promise.all(
      (data || []).map(async (item) => {
        let repeat_config;
        let recurrence_rule;

        if (item.recurrence_id) {
          try {
            const ruleResult = await supabase
              .from("recurrence_rule")
              .select("*")
              .eq("id", item.recurrence_id)
              .single();

            if (ruleResult.data) {
              recurrence_rule = ruleResult.data;
              repeat_config = convertRecurrenceRuleToRepeatConfig(ruleResult.data);
            }
          } catch (ruleError) {
            console.warn('Failed to fetch recurrence rule:', ruleError);
          }
        }

        return {
          ...item,
          repeat_config,
          recurrence_rule,
        };
      })
    );

    return { success: true, data: parsedData };
  } catch (error) {
    console.error('Get today todo items error:', error);
    return { success: false, error: "오늘 할 일 조회 중 오류가 발생했습니다" };
  }
}

/**
 * 중요 작업 조회 (is_important가 true인 작업)
 */
export async function getImportantTodoItems(
  _userId: string
): Promise<ServiceResult<TodoItem[]>> {
  try {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", _userId)
      .eq("is_important", true)
      .order("position");

    if (error) {
      console.error('getImportantTodoItems query failed:', error);
      return handleServiceError(error);
    }

    // 반복 설정을 UI 형태로 변환
    const parsedData = await Promise.all(
      (data || []).map(async (item) => {
        let repeat_config;
        let recurrence_rule;

        if (item.recurrence_id) {
          try {
            const ruleResult = await supabase
              .from("recurrence_rule")
              .select("*")
              .eq("id", item.recurrence_id)
              .single();

            if (ruleResult.data) {
              recurrence_rule = ruleResult.data;
              repeat_config = convertRecurrenceRuleToRepeatConfig(ruleResult.data);
            }
          } catch (ruleError) {
            console.warn('Failed to fetch recurrence rule:', ruleError);
          }
        }

        return {
          ...item,
          repeat_config,
          recurrence_rule,
        };
      })
    );

    return { success: true, data: parsedData };
  } catch (error) {
    console.error('Get important todo items error:', error);
    return { success: false, error: "중요 작업 조회 중 오류가 발생했습니다" };
  }
}

/**
 * 시스템 리스트 조회 (is_system이 true인 list)
 */
export async function getSystemList(
  _userId: string
): Promise<ServiceResult<{ id: number; name: string; color: string; is_system: boolean }>> {
  try {
    const { data, error } = await supabase
      .from("lists")
      .select("id, name, color, is_system")
      .eq("user_id", _userId)
      .eq("is_system", true)
      .single();

    if (error) {
      console.error('getSystemList query failed:', error);
      return handleServiceError(error);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get system list error:', error);
    return { success: false, error: "시스템 리스트 조회 중 오류가 발생했습니다" };
  }
}