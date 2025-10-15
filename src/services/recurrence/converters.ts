import type { RecurrenceRule, RepeatConfig, DayOfWeek, RecurrenceFrequency } from "@/types/todoItem";

/**
 * RepeatConfig를 RecurrenceRule로 변환
 *
 * 간소화된 반복 설정:
 * - daily: 매일
 * - weekdays: 평일 (월~금)
 * - weekly: 매주 월요일 (기본값)
 * - monthly: 매월 1일 (기본값)
 * - custom: 사용자 지정 (interval, daysOfWeek 활용)
 */
export function convertRepeatConfigToRecurrenceRule(config: RepeatConfig): Omit<RecurrenceRule, 'id' | 'user_id'> {
  // none 타입은 변환하지 않음
  if (config.type === 'none') {
    throw new Error('none 타입은 RecurrenceRule로 변환할 수 없습니다');
  }

  const rule: Omit<RecurrenceRule, 'id' | 'user_id'> = {
    frequency: mapRepeatTypeToFrequency(config.type, config),
    interval: 1, // 기본값 1, custom일 때만 config.interval 사용
    is_active: true,
  };

  // 타입별 처리
  switch (config.type) {
    case 'daily':
      // 매일: day_of_weeks를 명시적으로 null로 설정
      rule.day_of_weeks = null;
      break;

    case 'weekdays':
      // 평일: 월~금 설정
      rule.day_of_weeks = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      break;

    case 'weekly':
      // 매주 월요일 (기본값)
      rule.day_of_weeks = ['MONDAY'];
      break;

    case 'monthly':
      // 매월 1일 (기본값, day_of_weeks를 명시적으로 null로 설정)
      rule.day_of_weeks = null;
      break;

    case 'custom':
      // 사용자 지정: interval과 daysOfWeek 활용
      rule.interval = config.interval || 1;

      // custom + weekly인 경우 요일 설정
      if (rule.frequency === 'WEEKLY' && config.daysOfWeek && config.daysOfWeek.length > 0) {
        rule.day_of_weeks = config.daysOfWeek.map(day => DAY_NUMBER_TO_ENUM[day]);
      }
      break;
  }

  return rule;
}

/**
 * RecurrenceRule을 RepeatConfig로 변환
 *
 * 간소화된 역변환:
 * - 평일 패턴 자동 감지
 * - 매주 월요일만 있으면 weekly
 * - 매월은 monthly
 * - 그 외는 custom
 */
export function convertRecurrenceRuleToRepeatConfig(rule: RecurrenceRule): RepeatConfig {
  console.log('[convertRecurrenceRuleToRepeatConfig] Input rule:', JSON.stringify(rule, null, 2));

  // 평일 반복 패턴 감지 (day_of_weeks가 월~금만 있는 경우)
  // WEEKLY frequency + interval 1 + 정확히 5개 평일
  if (rule.frequency === 'WEEKLY' && rule.interval === 1 && rule.day_of_weeks && rule.day_of_weeks.length === 5) {
    const weekdaysSet = new Set<DayOfWeek>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
    const ruleWeekdaysSet = new Set(rule.day_of_weeks);

    const isWeekdaysOnly =
      ruleWeekdaysSet.size === 5 &&
      Array.from(weekdaysSet).every(day => ruleWeekdaysSet.has(day));

    if (isWeekdaysOnly) {
      console.log('[convertRecurrenceRuleToRepeatConfig] Matched weekdays pattern');
      return { type: 'weekdays' };
    }
  }

  // 매주 월요일 패턴 감지
  if (
    rule.frequency === 'WEEKLY' &&
    rule.interval === 1 &&
    rule.day_of_weeks?.length === 1 &&
    rule.day_of_weeks[0] === 'MONDAY'
  ) {
    console.log('[convertRecurrenceRuleToRepeatConfig] Matched weekly pattern');
    return { type: 'weekly' };
  }

  // 매일 패턴 (day_of_weeks가 null, undefined, 또는 빈 배열)
  if (
    rule.frequency === 'DAILY' &&
    rule.interval === 1 &&
    (!rule.day_of_weeks || rule.day_of_weeks.length === 0)
  ) {
    console.log('[convertRecurrenceRuleToRepeatConfig] Matched daily pattern');
    return { type: 'daily' };
  }

  // 매월 1일 패턴
  if (rule.frequency === 'MONTHLY' && rule.interval === 1) {
    console.log('[convertRecurrenceRuleToRepeatConfig] Matched monthly pattern');
    return { type: 'monthly' };
  }

  // 사용자 지정 (custom)
  const config: RepeatConfig = {
    type: 'custom',
    interval: rule.interval,
  };

  // 주간 반복일 때 요일 변환 (ENUM → 숫자)
  if (rule.frequency === 'WEEKLY' && rule.day_of_weeks && rule.day_of_weeks.length > 0) {
    config.daysOfWeek = rule.day_of_weeks
      .map(day => DAY_ENUM_TO_NUMBER[day])
      .filter(num => num !== undefined)
      .sort((a, b) => a - b); // 일요일(0)부터 정렬
  }

  console.log('[convertRecurrenceRuleToRepeatConfig] Fallback to custom:', JSON.stringify(config, null, 2));
  return config;
}

// ============================================================================
// Helper Functions & Constants
// ============================================================================

/**
 * RepeatConfig.type을 RecurrenceRule.frequency로 매핑
 */
function mapRepeatTypeToFrequency(type: RepeatConfig['type'], config?: RepeatConfig): RecurrenceFrequency {
  switch (type) {
    case 'daily':
      return 'DAILY';
    case 'weekdays':
      // weekdays는 요일 기반 반복이므로 WEEKLY로 저장
      return 'WEEKLY';
    case 'weekly':
      return 'WEEKLY';
    case 'monthly':
      return 'MONTHLY';
    case 'custom':
      // custom일 때 daysOfWeek가 있으면 WEEKLY, 없으면 DAILY
      if (config?.daysOfWeek && config.daysOfWeek.length > 0) {
        return 'WEEKLY';
      }
      return 'DAILY';
    default:
      throw new Error(`Unsupported repeat type: ${type}`);
  }
}

/**
 * 요일 숫자(0-6)를 DayOfWeek ENUM으로 변환
 * 0 = SUNDAY, 1 = MONDAY, ..., 6 = SATURDAY
 */
const DAY_NUMBER_TO_ENUM: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

/**
 * DayOfWeek ENUM을 요일 숫자(0-6)로 변환
 */
const DAY_ENUM_TO_NUMBER: Record<DayOfWeek, number> = {
  'SUNDAY': 0,
  'MONDAY': 1,
  'TUESDAY': 2,
  'WEDNESDAY': 3,
  'THURSDAY': 4,
  'FRIDAY': 5,
  'SATURDAY': 6,
};
