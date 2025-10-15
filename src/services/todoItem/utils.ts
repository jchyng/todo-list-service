import { supabase } from "@/lib/supabase";
import type { TodoItem } from "@/types/todoItem";
import { convertRecurrenceRuleToRepeatConfig } from "../recurrence";
import { todoLogger } from "@/lib/logger";

/**
 * 반복 설정 조회 및 변환
 */
export async function fetchRecurrenceConfig(recurrenceId: number) {
  try {
    // SELECT와 필터를 분리하여 406 에러 방지
    const { data: ruleData, error } = await supabase
      .from("recurrence_rule")
      .select("*")
      .eq("id", recurrenceId)
      .eq("is_active", true)
      .maybeSingle();  // single() 대신 maybeSingle() 사용

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
export async function enrichItemsWithRecurrence(items: any[]): Promise<TodoItem[]> {
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
 * Position 계산
 */
export async function generateNewPosition(): Promise<string> {
  const { data: positionResult } = await supabase.rpc('generate_position_between', {
    p_before: null,
    p_after: null
  });

  return positionResult || 'n';
}
