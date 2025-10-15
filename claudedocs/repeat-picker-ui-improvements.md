# Repeat Picker UI 개선 사항

## 변경 개요

반복 설정 UI를 사용자 요구사항에 맞게 간소화하고 직관적으로 개선했습니다.

## 주요 변경 사항

### 1. 5가지 간단한 반복 옵션

**Before**: 반복 안함, 매일, 평일, 매주, 매월, 매년 (6가지)

**After**: 매일, 평일, 매주, 매월, 사용자 정의 (5가지)

```typescript
const REPEAT_OPTIONS = [
  { type: "daily", label: "매일" },
  { type: "weekdays", label: "평일" },
  { type: "weekly", label: "매주" },
  { type: "monthly", label: "매월" },
  { type: "custom", label: "사용자 정의" },
];
```

### 2. 즉시 적용 시스템

**기본 옵션 (매일, 평일, 매주, 매월)**
- 클릭 즉시 적용, 추가 설정 불필요
- Popover 자동 닫힘
- `handleBasicOptionSelect` 함수로 처리

```typescript
const handleBasicOptionSelect = (type: "daily" | "weekdays" | "weekly" | "monthly") => {
  const config: RepeatConfig = { type };
  onChange?.(config);
  setOpen(false);  // 즉시 닫힘
};
```

**사용자 정의 옵션**
- 클릭 시 추가 설정 UI 표시
- 반복 주기(interval), 반복 단위(frequency), 요일 선택
- 적용 버튼 클릭 시 반영

### 3. 사용자 정의 설정 UI 구조

#### 3-1. 반복 주기 입력
```
[-] [__2__] [+]
```
- 숫자 직접 입력 가능
- +/- 버튼으로 증감 가능
- 최소값: 1

#### 3-2. 반복 단위 선택
```
[ ] 일 마다
[ ] 주 마다  → 선택 시 요일 선택 UI 표시
[ ] 월 마다
```

#### 3-3. 요일 선택 (주 마다 선택 시만 표시)
```
[월] [화] [수] [목] [금] [토] [일]
```
- 다중 선택 가능
- 선택된 요일은 파란색 하이라이트

### 4. 새로운 상태 관리

```typescript
// 기존 상태
const [selectedType, setSelectedType] = useState<RepeatConfig["type"]>("none");
const [interval, setInterval] = useState(1);
const [selectedDays, setSelectedDays] = useState<number[]>([]);

// 추가된 상태
const [customFrequency, setCustomFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
```

### 5. 포맷 함수 개선

```typescript
const formatRepeatConfig = (config: RepeatConfig) => {
  switch (config.type) {
    case "daily":
      return "매일";
    case "weekdays":
      return "평일 (월~금)";
    case "weekly":
      return "매주 (월요일)";
    case "monthly":
      return "매월 (1일)";
    case "custom":
      // 사용자 정의 포맷
      if (config.daysOfWeek) {
        return `${config.interval}주마다 ${dayLabels.join(", ")}`;
      }
      return `${config.interval}일마다`;
    default:
      return "사용자 정의";
  }
};
```

## UI 플로우

### 시나리오 1: 평일 반복 설정
1. 반복 설정 버튼 클릭
2. "평일" 옵션 클릭 → **즉시 적용 완료 + Popover 닫힘**
3. 버튼에 "평일 (월~금)" 표시

### 시나리오 2: 매주 반복 설정
1. 반복 설정 버튼 클릭
2. "매주" 옵션 클릭 → **즉시 적용 완료 + Popover 닫힘**
3. 버튼에 "매주 (월요일)" 표시

### 시나리오 3: 2일마다 반복 (사용자 정의)
1. 반복 설정 버튼 클릭
2. "사용자 정의" 옵션 클릭 → **추가 설정 UI 표시**
3. 반복 주기: `2` 입력
4. "일 마다" 선택
5. "적용" 버튼 클릭 → **적용 완료 + Popover 닫힘**
6. 버튼에 "2일마다" 표시

### 시나리오 4: 2주마다 화/목 반복 (사용자 정의)
1. 반복 설정 버튼 클릭
2. "사용자 정의" 옵션 클릭 → **추가 설정 UI 표시**
3. 반복 주기: `2` 입력
4. "주 마다" 선택 → **요일 선택 UI 표시**
5. 요일: 화, 목 선택
6. "적용" 버튼 클릭 → **적용 완료 + Popover 닫힘**
7. 버튼에 "2주마다 화, 목" 표시

### 시나리오 5: 3개월마다 반복 (사용자 정의)
1. 반복 설정 버튼 클릭
2. "사용자 정의" 옵션 클릭 → **추가 설정 UI 표시**
3. 반복 주기: `3` 입력
4. "월 마다" 선택
5. "적용" 버튼 클릭 → **적용 완료 + Popover 닫힘**
6. 버튼에 "3일마다" 표시 (월 단위는 custom에서 일 단위로 처리)

## 주요 함수

### handleBasicOptionSelect
기본 옵션(매일, 평일, 매주, 매월) 선택 시 즉시 적용
```typescript
const handleBasicOptionSelect = (type: "daily" | "weekdays" | "weekly" | "monthly") => {
  const config: RepeatConfig = { type };
  onChange?.(config);
  setOpen(false);
};
```

### handleCustomOptionClick
사용자 정의 옵션 클릭 시 초기값 설정
```typescript
const handleCustomOptionClick = () => {
  setSelectedType("custom");
  setInterval(1);
  setCustomFrequency("weekly");
  setSelectedDays([]);
};
```

### handleCustomApply
사용자 정의 설정 적용
```typescript
const handleCustomApply = () => {
  const config: RepeatConfig = {
    type: "custom",
    interval,
  };

  // 주간 반복일 때 선택된 요일 추가
  if (customFrequency === "weekly" && selectedDays.length > 0) {
    config.daysOfWeek = selectedDays;
  }

  onChange?.(config);
  setOpen(false);
};
```

## 데이터 매핑

| UI 선택 | RepeatConfig 출력 |
|---------|------------------|
| 매일 | `{ type: 'daily' }` |
| 평일 | `{ type: 'weekdays' }` |
| 매주 | `{ type: 'weekly' }` |
| 매월 | `{ type: 'monthly' }` |
| 사용자 정의 (2일마다) | `{ type: 'custom', interval: 2 }` |
| 사용자 정의 (2주마다 화/목) | `{ type: 'custom', interval: 2, daysOfWeek: [2, 4] }` |

## UI 구조

### 기본 화면 (사용자 정의 선택 전)
```
┌─────────────────────────┐
│ 반복 설정               │
├─────────────────────────┤
│ [ ] 매일               │ ← 클릭 시 즉시 적용
│ [ ] 평일               │ ← 클릭 시 즉시 적용
│ [ ] 매주               │ ← 클릭 시 즉시 적용
│ [ ] 매월               │ ← 클릭 시 즉시 적용
│ [✓] 사용자 정의        │ ← 클릭 시 하단 UI 표시
└─────────────────────────┘
```

### 사용자 정의 선택 시
```
┌─────────────────────────┐
│ 반복 설정               │
├─────────────────────────┤
│ [ ] 매일               │
│ [ ] 평일               │
│ [ ] 매주               │
│ [ ] 매월               │
│ [✓] 사용자 정의        │
├─────────────────────────┤
│ 반복 주기              │
│ [-] [_2_] [+]          │
├─────────────────────────┤
│ 반복 단위              │
│ [ ] 일 마다            │
│ [✓] 주 마다            │ ← 선택 시 요일 선택 표시
│ [ ] 월 마다            │
├─────────────────────────┤
│ 요일 선택              │
│ [월][화][수][목][금][토][일] │
├─────────────────────────┤
│ [취소]      [적용]     │
└─────────────────────────┘
```

## 스타일링

### 선택 상태 하이라이트
- 배경: `bg-blue-50 dark:bg-blue-900/20`
- 텍스트: `text-blue-600 dark:text-blue-400`
- 테두리(요일): `border-blue-200 dark:border-blue-700`

### 버튼 크기
- 옵션 버튼: `h-7` (28px)
- 요일 버튼: `h-7 w-full`
- 숫자 증감 버튼: `h-7 w-7` (28px × 28px)

## 개선 효과

### 사용자 경험
✅ **5가지 간단한 옵션으로 직관적**
- 매일, 평일, 매주, 매월은 클릭만으로 즉시 적용
- 복잡한 설정은 사용자 정의로 숨김

✅ **즉시 피드백**
- 기본 옵션 선택 시 즉시 적용 및 Popover 닫힘
- 추가 클릭 불필요

✅ **단계적 복잡도**
- 간단한 작업: 1클릭으로 완료
- 복잡한 작업: 사용자 정의에서 세밀하게 설정

### 코드 품질
✅ **명확한 함수 분리**
- `handleBasicOptionSelect`: 기본 옵션 처리
- `handleCustomApply`: 사용자 정의 처리

✅ **타입 안전성**
- TypeScript 컴파일 성공
- 명확한 타입 정의

✅ **유지보수성**
- 로직 분리로 이해하기 쉬운 코드
- 확장 가능한 구조

## 테스트 체크리스트

- [ ] 매일 옵션 클릭 → 즉시 적용 확인
- [ ] 평일 옵션 클릭 → 즉시 적용 확인
- [ ] 매주 옵션 클릭 → 즉시 적용 확인
- [ ] 매월 옵션 클릭 → 즉시 적용 확인
- [ ] 사용자 정의 클릭 → 추가 설정 UI 표시 확인
- [ ] 반복 주기 입력 → 숫자 증감 및 직접 입력 확인
- [ ] 일 마다 선택 → 요일 선택 숨김 확인
- [ ] 주 마다 선택 → 요일 선택 표시 확인
- [ ] 월 마다 선택 → 요일 선택 숨김 확인
- [ ] 요일 다중 선택 → 선택 상태 하이라이트 확인
- [ ] 사용자 정의 적용 → 올바른 포맷 표시 확인
- [ ] 반복 제거 (X 버튼) → 초기화 확인

## 파일 변경

**수정된 파일:**
- `src/components/ui/repeat-picker.tsx`: 전면 개선

**주요 변경 내용:**
1. `REPEAT_OPTIONS` → 5개 옵션으로 간소화
2. `CUSTOM_FREQUENCY_OPTIONS` 추가
3. `customFrequency` 상태 추가
4. `handleBasicOptionSelect` 함수 추가
5. `handleCustomOptionClick` 함수 추가
6. `handleCustomApply` 함수 추가
7. `formatRepeatConfig` 간소화
8. UI 구조 전면 재구성
