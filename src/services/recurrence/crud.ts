import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";
import type { RecurrenceRule, RepeatConfig } from "@/types/todoItem";
import { convertRepeatConfigToRecurrenceRule } from "./converters";
import { todoLogger } from "@/lib/logger";

/**
 * recurrence_rule 생성
 */
export async function createRecurrenceRule(
  config: RepeatConfig
): Promise<ServiceResult<RecurrenceRule>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: "인증이 필요합니다" };
    }

    const rule = convertRepeatConfigToRecurrenceRule(config);

    const { data, error } = await supabase
      .from("recurrence_rule")
      .insert({
        ...rule,
        user_id: session.user.id
      })
      .select()
      .single();

    if (error) return handleServiceError(error);
    return { success: true, data };
  } catch (error) {
    todoLogger.error('Create recurrence rule error', { error });
    return { success: false, error: "반복 규칙 생성 중 오류가 발생했습니다" };
  }
}

/**
 * recurrence_rule 업데이트
 */
export async function updateRecurrenceRule(
  id: number,
  config: RepeatConfig
): Promise<ServiceResult<RecurrenceRule>> {
  try {
    const rule = convertRepeatConfigToRecurrenceRule(config);

    const { data, error } = await supabase
      .from("recurrence_rule")
      .update(rule)
      .eq("id", id)
      .select()
      .single();

    if (error) return handleServiceError(error);
    return { success: true, data };
  } catch (error) {
    todoLogger.error('Update recurrence rule error', { error });
    return { success: false, error: "반복 규칙 업데이트 중 오류가 발생했습니다" };
  }
}

/**
 * recurrence_rule 삭제
 */
export async function deleteRecurrenceRule(id: number): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from("recurrence_rule")
      .delete()
      .eq("id", id);

    if (error) return handleServiceError(error);
    return { success: true };
  } catch (error) {
    todoLogger.error('Delete recurrence rule error', { error });
    return { success: false, error: "반복 규칙 삭제 중 오류가 발생했습니다" };
  }
}

/**
 * recurrence_rule 조회
 */
export async function getRecurrenceRule(id: number): Promise<ServiceResult<RecurrenceRule>> {
  try {
    const { data, error } = await supabase
      .from("recurrence_rule")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return handleServiceError(error);
    return { success: true, data };
  } catch (error) {
    todoLogger.error('Get recurrence rule error', { error });
    return { success: false, error: "반복 규칙 조회 중 오류가 발생했습니다" };
  }
}
