# Repeat Picker Test Analysis

## Test Objective
Test whether the repeat picker correctly displays "매일" (daily) after saving and reopening, or if it incorrectly shows "사용자 정의 -> 1 일".

## Code Analysis Findings

### Expected Behavior (from `repeat-picker.tsx`)

When a todo item has `type: "daily"` set, the `formatRepeatConfig` function (lines 125-163) should:

1. **For `type: "daily"`** → Return `"매일"` (line 130)
2. **For `type: "custom"` with interval 1 and no daysOfWeek** → Return `"매일"` (line 156)

### Conversion Logic (from `converters.ts`)

**RepeatConfig → RecurrenceRule (lines 13-57):**
- `type: "daily"` → `frequency: "DAILY"`, `interval: 1`, no `day_of_weeks`

**RecurrenceRule → RepeatConfig (lines 68-130):**
- `frequency: "DAILY"` AND `interval: 1` AND no `day_of_weeks` → `type: "daily"` (lines 99-106)

**Potential Issue:**
If the database stores a RecurrenceRule with:
- `frequency: "DAILY"`
- `interval: 1`
- But `day_of_weeks` is somehow NOT null/undefined/empty

Then it would fall through to the `custom` case (lines 114-129) instead of matching the `daily` pattern.

## Test Steps (Manual)

Since the app requires Google authentication, here are manual testing steps:

1. **Navigate to** `http://localhost:5173`
2. **Login** with Google
3. **Create or select** a todo item
4. **Open** the todo detail panel
5. **Click** the repeat field (shows "반복 설정" by default)
6. **Select** "매일" option
7. **Observe** the repeat field now shows "매일" (in blue text)
8. **Close** the detail panel (click outside or close button)
9. **Reopen** the same todo item
10. **Check** the repeat field display
11. **Click** the repeat field again
12. **Take screenshot** of what's shown in the picker

## Expected Results

✅ **CORRECT:** Repeat field shows "매일"
- The picker should highlight "매일" option as selected (blue background)
- The button text should display "매일"

❌ **INCORRECT:** Repeat field shows "사용자 정의 -> 1 일" or "1일마다"
- This would indicate the conversion is falling through to `custom` type
- The picker might show "사용자 정의" as selected with custom controls visible

## Debugging Recommendations

If the issue occurs, check browser console for:
```
[convertRecurrenceRuleToRepeatConfig] Input rule: ...
[convertRecurrenceRuleToRepeatConfig] Matched daily pattern
```

Or if it falls through:
```
[convertRecurrenceRuleToRepeatConfig] Fallback to custom: ...
```

## Root Cause Hypothesis

The issue likely occurs in one of these scenarios:

1. **Database Schema Issue**: `day_of_weeks` column might have a default value or constraint that prevents null
2. **Conversion Logic**: The converter might be setting `day_of_weeks` to an empty array `[]` instead of `null`
3. **Type Mismatch**: The comparison `!rule.day_of_weeks || rule.day_of_weeks.length === 0` might not handle all cases

## Recommended Fix

Check the `convertRepeatConfigToRecurrenceRule` function (line 27-29):
```typescript
case 'daily':
  // 매일: 추가 설정 불필요
  break;
```

This doesn't explicitly set `day_of_weeks` to `null`. Consider adding:
```typescript
case 'daily':
  // 매일: day_of_weeks는 명시적으로 null 또는 undefined
  rule.day_of_weeks = undefined; // or null
  break;
```

Or ensure the database column allows null and doesn't default to empty array.
