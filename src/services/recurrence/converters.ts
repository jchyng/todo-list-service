import type { RecurrenceRule, RepeatConfig } from "@/types/todoItem";

/**
 * RepeatConfig를 RecurrenceRule로 변환
 */
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

/**
 * RecurrenceRule을 RepeatConfig로 변환
 */
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
