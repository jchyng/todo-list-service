import { supabase } from "@/lib/supabase";
import type { ServiceResult } from "@/utils/serviceUtils";
import { handleServiceError } from "@/utils/serviceUtils";
import type { RecurrenceRule, RepeatConfig, RecurrenceException } from "@/types/todoItem";

// RepeatConfig를 RecurrenceRule로 변환
export function convertRepeatConfigToRecurrenceRule(config: RepeatConfig): Omit<RecurrenceRule, 'id'> {
  // none 타입은 변환하지 않음
  if (config.type === 'none') {
    throw new Error('none 타입은 RecurrenceRule로 변환할 수 없습니다');
  }

  const rule: Omit<RecurrenceRule, 'id'> = {
    frequency: config.type === 'weekdays' ? 'DAILY' : config.type.toUpperCase() as RecurrenceRule['frequency'],
    interval: config.interval || 1,
    weekdays_only: config.type === 'weekdays', // 평일만 반복 설정
  };

  // 주간 반복일 때 요일 설정
  if (config.type === 'weekly' && config.daysOfWeek && config.daysOfWeek.length > 0) {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    rule.by_day = config.daysOfWeek.map(day => dayNames[day]).join(',');
  }

  // 월간 반복일 때 날짜 설정
  if (config.type === 'monthly' && config.dayOfMonth) {
    rule.by_month_day = config.dayOfMonth.toString();
  }

  // 종료 날짜 설정
  if (config.endDate) {
    rule.until = config.endDate.toISOString();
  }

  // 반복 횟수 설정
  if (config.occurrences) {
    rule.count = config.occurrences;
  }

  return rule;
}

// RecurrenceRule을 RepeatConfig로 변환
export function convertRecurrenceRuleToRepeatConfig(rule: RecurrenceRule): RepeatConfig {
  // 평일 반복 처리
  if (rule.frequency === 'DAILY' && rule.weekdays_only) {
    const config: RepeatConfig = {
      type: 'weekdays',
      interval: rule.interval,
    };

    // 종료 날짜 변환
    if (rule.until) {
      config.endDate = new Date(rule.until);
    }

    // 반복 횟수 변환
    if (rule.count) {
      config.occurrences = rule.count;
    }

    return config;
  }

  const config: RepeatConfig = {
    type: rule.frequency.toLowerCase() as RepeatConfig['type'],
    interval: rule.interval,
  };

  // 주간 반복일 때 요일 변환
  if (rule.frequency === 'WEEKLY' && rule.by_day) {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const days = rule.by_day.split(',');
    config.daysOfWeek = days.map(day => dayNames.indexOf(day.trim())).filter(index => index !== -1);
  }

  // 월간 반복일 때 날짜 변환
  if (rule.frequency === 'MONTHLY' && rule.by_month_day) {
    config.dayOfMonth = parseInt(rule.by_month_day);
  }

  // 종료 날짜 변환
  if (rule.until) {
    config.endDate = new Date(rule.until);
  }

  // 반복 횟수 변환
  if (rule.count) {
    config.occurrences = rule.count;
  }

  return config;
}

// 새 recurrence_rule 생성
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
    console.error('Create recurrence rule error:', error);
    return { success: false, error: "반복 규칙 생성 중 오류가 발생했습니다" };
  }
}

// recurrence_rule 업데이트
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
    console.error('Update recurrence rule error:', error);
    return { success: false, error: "반복 규칙 업데이트 중 오류가 발생했습니다" };
  }
}

// recurrence_rule 삭제
export async function deleteRecurrenceRule(id: number): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from("recurrence_rule")
      .delete()
      .eq("id", id);

    if (error) return handleServiceError(error);
    return { success: true };
  } catch (error) {
    console.error('Delete recurrence rule error:', error);
    return { success: false, error: "반복 규칙 삭제 중 오류가 발생했습니다" };
  }
}

// recurrence_rule 조회
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
    console.error('Get recurrence rule error:', error);
    return { success: false, error: "반복 규칙 조회 중 오류가 발생했습니다" };
  }
}

// ======================================
// 반복 예외 처리 함수들
// ======================================

// 반복 예외 추가 (특정 날짜 제외)
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
    console.error('Add recurrence exception error:', error);
    return { success: false, error: "반복 예외 추가 중 오류가 발생했습니다" };
  }
}

// 반복 예외 조회
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
    console.error('Get recurrence exceptions error:', error);
    return { success: false, error: "반복 예외 조회 중 오류가 발생했습니다" };
  }
}

// 반복 예외 삭제
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
    console.error('Remove recurrence exception error:', error);
    return { success: false, error: "반복 예외 삭제 중 오류가 발생했습니다" };
  }
}

// 특정 날짜가 예외 처리되었는지 확인
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
    console.error('Check date exception error:', error);
    return { success: false, error: "예외 날짜 확인 중 오류가 발생했습니다" };
  }
}