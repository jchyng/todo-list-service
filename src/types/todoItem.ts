// recurrence_rule 테이블 기반 타입
export interface RecurrenceRule {
  id?: number;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  interval: number;
  by_day?: string; // 요일 (MON,TUE,WED,THU,FRI,SAT,SUN)
  by_month_day?: string; // 날짜 (1-31)
  until?: string; // 종료 날짜 ISO string
  count?: number; // 반복 횟수
  weekdays_only?: boolean; // 평일만 반복 (월-금)
  created_at?: string;
  updated_at?: string;
}

// 반복 예외 처리 타입
export interface RecurrenceException {
  id?: number;
  recurrence_id: number;
  exception_date: string; // DATE string (YYYY-MM-DD)
  exception_type: "deleted" | "modified" | "completed";
  created_at?: string;
}

// UI에서 사용하는 간소화된 반복 설정 타입
export interface RepeatConfig {
  type: "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly" | "custom";
  interval?: number;
  daysOfWeek?: number[]; // 0 = 일요일, 1 = 월요일, ...
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
}

export interface TodoItem {
  id: number;
  user_id: string;
  list_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  is_important: boolean;
  position: string;
  due_date?: string;
  added_to_my_day_date?: string;
  recurrence_id?: number; // recurrence_rule 테이블 참조
  repeat_config?: RepeatConfig; // UI에서 사용하는 임시 필드
  recurrence_rule?: RecurrenceRule; // JOIN된 recurrence_rule 데이터
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateTodoItemData {
  list_id: number;
  title: string;
  description?: string;
  due_date?: string;
  added_to_my_day_date?: string;
  is_important?: boolean;
  repeat_config?: RepeatConfig;
}

export interface UpdateTodoItemData {
  title?: string;
  description?: string;
  is_completed?: boolean;
  position?: string;
  due_date?: string;
  added_to_my_day_date?: string | null;
  is_important?: boolean;
  repeat_config?: RepeatConfig;
  recurrence_id?: number; // recurrence_rule 테이블 참조
}

export interface TodoItemWithOptimistic extends TodoItem {
  _isOptimistic?: boolean;
  _originalData?: Partial<TodoItem>;
}