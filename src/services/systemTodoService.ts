import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";
import type { TodoItem } from "@/types/todoItem";
import { convertRecurrenceRuleToRepeatConfig } from "./recurrenceRuleService";
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

/**
 * 오늘 할 일 조회 (added_to_my_day_date가 오늘인 작업)
 */
export async function getTodayTodoItems(
  _userId: string
): Promise<ServiceResult<TodoItem[]>> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("user_id", _userId)
      .eq("added_to_my_day_date", today)
      .order("position");

    if (error) {
      todoLogger.error('getTodayTodoItems query failed', { error });
      return handleServiceError<TodoItem[]>(error);
    }

    const enrichedData = await enrichItemsWithRecurrence(data || []);
    return { success: true, data: enrichedData };
  } catch (error) {
    todoLogger.error('Get today todo items error', { error });
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
      todoLogger.error('getImportantTodoItems query failed', { error });
      return handleServiceError<TodoItem[]>(error);
    }

    const enrichedData = await enrichItemsWithRecurrence(data || []);
    return { success: true, data: enrichedData };
  } catch (error) {
    todoLogger.error('Get important todo items error', { error });
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
      todoLogger.error('getSystemList query failed', { error });
      return handleServiceError<{ id: number; name: string; color: string; is_system: boolean }>(error);
    }

    return { success: true, data };
  } catch (error) {
    todoLogger.error('Get system list error', { error });
    return { success: false, error: "시스템 리스트 조회 중 오류가 발생했습니다" };
  }
}
