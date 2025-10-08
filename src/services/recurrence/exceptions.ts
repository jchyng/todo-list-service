import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";
import type { RecurrenceException } from "@/types/todoItem";
import { todoLogger } from "@/lib/logger";

/**
 * 반복 예외 추가 (특정 날짜 제외)
 */
export async function addRecurrenceException(
  recurrenceId: number,
  exceptionDate: string, // YYYY-MM-DD 형식
  exceptionType: RecurrenceException['exception_type'] = 'deleted'
): Promise<ServiceResult<RecurrenceException>> {
  try {
    const { data, error } = await supabase
      .from("recurrence_exceptions")
      .insert({
        recurrence_id: recurrenceId,
        exception_date: exceptionDate,
        exception_type: exceptionType,
      })
      .select()
      .single();

    if (error) return handleServiceError(error);
    return { success: true, data };
  } catch (error) {
    todoLogger.error('Add recurrence exception error', { error });
    return { success: false, error: "반복 예외 추가 중 오류가 발생했습니다" };
  }
}

/**
 * 반복 예외 조회
 */
export async function getRecurrenceExceptions(
  recurrenceId: number
): Promise<ServiceResult<RecurrenceException[]>> {
  try {
    const { data, error } = await supabase
      .from("recurrence_exceptions")
      .select("*")
      .eq("recurrence_id", recurrenceId)
      .order("exception_date");

    if (error) return handleServiceError(error);
    return { success: true, data: data || [] };
  } catch (error) {
    todoLogger.error('Get recurrence exceptions error', { error });
    return { success: false, error: "반복 예외 조회 중 오류가 발생했습니다" };
  }
}

/**
 * 반복 예외 삭제
 */
export async function removeRecurrenceException(
  recurrenceId: number,
  exceptionDate: string
): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from("recurrence_exceptions")
      .delete()
      .eq("recurrence_id", recurrenceId)
      .eq("exception_date", exceptionDate);

    if (error) return handleServiceError(error);
    return { success: true };
  } catch (error) {
    todoLogger.error('Remove recurrence exception error', { error });
    return { success: false, error: "반복 예외 삭제 중 오류가 발생했습니다" };
  }
}

/**
 * 특정 날짜가 예외 처리되었는지 확인
 */
export async function isDateException(
  recurrenceId: number,
  date: string
): Promise<ServiceResult<boolean>> {
  try {
    const { data, error } = await supabase
      .from("recurrence_exceptions")
      .select("id")
      .eq("recurrence_id", recurrenceId)
      .eq("exception_date", date)
      .maybeSingle();

    if (error) return handleServiceError(error);
    return { success: true, data: !!data };
  } catch (error) {
    todoLogger.error('Check date exception error', { error });
    return { success: false, error: "예외 날짜 확인 중 오류가 발생했습니다" };
  }
}
