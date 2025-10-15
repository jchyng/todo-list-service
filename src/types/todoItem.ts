// recurrence_rule 테이블 기반 타입
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface RecurrenceRule {
  id?: number;
  user_id?: string;
  frequency: RecurrenceFrequency;
  interval: number;
  day_of_weeks?: DayOfWeek[]; // WEEKLY일 때 선택된 요일 배열
  is_active?: boolean; // 반복 활성화 여부
  created_at?: string;
}

// UI에서 사용하는 간소화된 반복 설정 타입
// 매일, 평일, 매주(월요일), 매월(1일), 사용자 지정
export interface RepeatConfig {
  type: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "custom";
  interval?: number; // custom일 때만 사용
  daysOfWeek?: number[]; // custom + weekly일 때만 사용 (0 = 일요일, 1 = 월요일, ...)
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
  scheduled_date?: string; // 오늘 할 일 추가 시 적용되는 작업 진행 날짜
  recurrence_id?: number; // recurrence_rule 테이블 참조
  repeat_config?: RepeatConfig; // UI에서 사용하는 임시 필드
  recurrence_rule?: RecurrenceRule; // JOIN된 recurrence_rule 데이터
  created_at?: string;
  completed_at?: string;
}

export interface CreateTodoItemData {
  list_id: number;
  title: string;
  description?: string;
  due_date?: string;
  scheduled_date?: string; // 오늘 할 일 추가 시 적용되는 작업 진행 날짜
  is_important?: boolean;
  repeat_config?: RepeatConfig;
}

export interface UpdateTodoItemData {
  title?: string;
  description?: string;
  is_completed?: boolean;
  position?: string;
  due_date?: string | null;
  scheduled_date?: string | null; // 오늘 할 일 추가 시 적용되는 작업 진행 날짜
  is_important?: boolean;
  repeat_config?: RepeatConfig | null;
  recurrence_id?: number | null; // recurrence_rule 테이블 참조
}

export interface TodoItemWithOptimistic extends TodoItem {
  _isOptimistic?: boolean;
  _originalData?: Partial<TodoItem>;
}