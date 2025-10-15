# Recurrence System Improvements Summary

## Changes Overview

반복 작업 시스템을 간소화하고 사용자 요구사항에 맞게 개선했습니다.

## 1. RepeatConfig 타입 간소화

### Before
```typescript
export interface RepeatConfig {
  type: "none" | "daily" | "weekly" | "weekdays" | "monthly" | "yearly" | "custom";
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
}
```

### After
```typescript
export interface RepeatConfig {
  type: "none" | "daily" | "weekdays" | "weekly" | "monthly" | "custom";
  interval?: number;           // custom일 때만 사용
  daysOfWeek?: number[];       // custom + weekly일 때만 사용
}
```

**변경 사항:**
- `yearly` 타입 제거
- `dayOfMonth`, `endDate`, `occurrences` 필드 제거 (종료 날짜/횟수 지정 불필요)
- 5가지 간단한 옵션 + 사용자 지정

## 2. 반복 옵션 구조

### 기본 옵션 (선택만 하면 끝)
1. **매일** (`daily`): 매일 반복
2. **평일** (`weekdays`): 월~금 반복
3. **매주** (`weekly`): 매주 월요일 반복 (기본값)
4. **매월** (`monthly`): 매월 1일 반복 (기본값)

### 사용자 지정 옵션 (`custom`)
- **반복 횟수** (`interval`): 몇 일/주/월마다 반복할지
- **요일 선택** (`daysOfWeek`): 주간 반복 시 요일 선택

## 3. Converter 개선

### convertRepeatConfigToRecurrenceRule
간소화된 반복 설정을 DB RecurrenceRule로 변환:
- `daily` → DAILY frequency
- `weekdays` → DAILY frequency + 월~금 요일 설정
- `weekly` → WEEKLY frequency + 월요일 (기본값)
- `monthly` → MONTHLY frequency
- `custom` → 사용자가 지정한 interval과 daysOfWeek 활용

### convertRecurrenceRuleToRepeatConfig
DB RecurrenceRule을 UI RepeatConfig로 역변환:
- 평일 패턴 자동 감지 (월~금만 있으면 `weekdays`)
- 매주 월요일만 있으면 `weekly`
- 매일 반복이면 `daily`
- 매월이면 `monthly`
- 그 외는 `custom`

## 4. 반복 규칙 비활성화 시스템

### 새 함수 추가: `deactivateRecurrenceRule`
```typescript
/**
 * recurrence_rule 비활성화
 *
 * 마지막 todoItem에서 반복 제거 시:
 * - is_active를 false로 설정하여 비활성화
 * - 이전 기록들의 recurrence_id는 그대로 유지됨
 */
export async function deactivateRecurrenceRule(
  id: number
): Promise<ServiceResult<RecurrenceRule>>
```

### 동작 방식
1. **반복 제거 시**: `is_active = false`로 설정 (삭제하지 않음)
2. **이전 기록들**: `recurrence_id` 그대로 유지하여 반복 설정 이력 보존
3. **새 반복 생성 방지**: `is_active = false`인 규칙은 더 이상 새 작업 생성하지 않음

## 5. TodoItem 서비스 개선

### updateTodoItem 함수 수정
```typescript
// 반복 제거: recurrence_rule 비활성화
if (data.repeat_config === null || data.repeat_config.type === 'none') {
  if (existingItem.recurrence_id) {
    // is_active를 false로 설정하여 비활성화 (삭제하지 않음)
    const deactivateResult = await deactivateRecurrenceRule(
      existingItem.recurrence_id
    );
    // recurrence_id는 유지 (이전 기록들과의 연결 유지)
  }
}
```

**기존 방식과의 차이:**
- **Before**: `recurrence_id = null`로 설정하여 완전히 연결 끊기
- **After**: `is_active = false`로 비활성화하되 `recurrence_id` 유지

## 6. 사용 시나리오

### 시나리오 1: 매주 월요일 반복 작업 생성
```typescript
const repeatConfig: RepeatConfig = {
  type: 'weekly'  // 그냥 선택만 하면 끝 (매주 월요일)
};
```

### 시나리오 2: 평일 반복 작업 생성
```typescript
const repeatConfig: RepeatConfig = {
  type: 'weekdays'  // 자동으로 월~금 설정됨
};
```

### 시나리오 3: 사용자 지정 - 2주마다 화/목 반복
```typescript
const repeatConfig: RepeatConfig = {
  type: 'custom',
  interval: 2,           // 2주마다
  daysOfWeek: [2, 4]     // 화요일, 목요일
};
```

### 시나리오 4: 반복 제거
```typescript
// 마지막 todoItem에서 반복 제거
await updateTodoItem(userId, itemId, {
  repeat_config: null  // 또는 { type: 'none' }
});
// → is_active = false로 설정
// → 이전 todoItem들의 recurrence_id는 그대로 유지
```

### 시나리오 5: 마지막 todoItem 삭제
```typescript
// 마지막 todoItem 삭제 시
await deleteTodoItem(userId, itemId);
// → todoItem만 삭제됨
// → recurrence_rule은 유지되지만 is_active = false이므로 새 작업 생성 안 됨
```

## 7. 데이터베이스 영향

### recurrence_rule 테이블
- `is_active` 컬럼 활용
- 삭제하지 않고 비활성화하여 이력 보존
- 이전 todoItem들은 여전히 반복 설정 정보 유지

### todo_items 테이블
- `recurrence_id` 컬럼 유지
- 반복 제거 시에도 이전 기록들의 `recurrence_id`는 그대로

## 8. 파일 변경 목록

1. **src/types/todoItem.ts**
   - RepeatConfig 인터페이스 간소화

2. **src/services/recurrence/converters.ts**
   - 간소화된 반복 패턴 변환 로직
   - 역변환 시 자동 패턴 감지

3. **src/services/recurrence/crud.ts**
   - `deactivateRecurrenceRule` 함수 추가

4. **src/services/recurrence/index.ts**
   - `deactivateRecurrenceRule` export 추가

5. **src/services/todoItem/crud.ts**
   - 반복 제거 시 비활성화 로직 적용

## 9. 테스트 권장 사항

1. **기본 반복 생성 테스트**
   - 매일, 평일, 매주, 매월 각각 생성
   - 자동으로 올바른 RecurrenceRule 생성 확인

2. **사용자 지정 반복 테스트**
   - interval과 daysOfWeek 조합 테스트
   - 2주마다, 3일마다 등 다양한 간격 테스트

3. **반복 제거 테스트**
   - 마지막 todoItem에서 반복 제거
   - is_active = false 확인
   - 이전 todoItem들의 recurrence_id 유지 확인

4. **반복 비활성화 후 동작 테스트**
   - is_active = false인 규칙은 새 작업 생성 안 함
   - 이전 todoItem들은 여전히 반복 정보 표시

## 10. 장점

✅ **사용자 경험 개선**
- 5가지 간단한 옵션으로 직관적
- 종료 날짜/횟수 설정 불필요

✅ **데이터 무결성**
- 반복 설정 이력 보존
- 이전 기록들과의 연결 유지

✅ **코드 간소화**
- 불필요한 필드 제거
- 명확한 변환 로직

✅ **유지보수성 향상**
- 명확한 타입 정의
- 간단한 비활성화 로직
