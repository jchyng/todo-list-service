import { cn } from "@/lib/utils";
import type { RepeatConfig } from "@/types/todoItem";
import { Repeat, X } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Popover } from "./popover";

interface RepeatPickerProps {
  value?: RepeatConfig;
  onChange?: (config: RepeatConfig | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// 5가지 간단한 반복 옵션
const REPEAT_OPTIONS = [
  { type: "daily" as const, label: "매일" },
  { type: "weekdays" as const, label: "평일" },
  { type: "weekly" as const, label: "매주" },
  { type: "monthly" as const, label: "매월" },
  { type: "custom" as const, label: "사용자 정의" },
];

// 사용자 정의 반복 단위
const CUSTOM_FREQUENCY_OPTIONS = [
  { value: "daily" as const, label: "일" },
  { value: "weekly" as const, label: "주" },
  { value: "monthly" as const, label: "월" },
];

const DAYS_OF_WEEK = [
  { value: 1, label: "월", shortLabel: "월" },
  { value: 2, label: "화", shortLabel: "화" },
  { value: 3, label: "수", shortLabel: "수" },
  { value: 4, label: "목", shortLabel: "목" },
  { value: 5, label: "금", shortLabel: "금" },
  { value: 6, label: "토", shortLabel: "토" },
  { value: 0, label: "일", shortLabel: "일" },
];

export function RepeatPicker({
  value,
  onChange,
  placeholder = "반복 설정",
  className,
  disabled = false,
}: RepeatPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<RepeatConfig["type"]>(
    value?.type || "none"
  );
  // 사용자 정의 전용 상태
  const [customFrequency, setCustomFrequency] = React.useState<"daily" | "weekly" | "monthly">("weekly");
  const [interval, setInterval] = React.useState(value?.interval || 1);
  const [selectedDays, setSelectedDays] = React.useState<number[]>(
    value?.daysOfWeek || []
  );

  // value prop이 변경될 때 로컬 상태 동기화
  React.useEffect(() => {
    if (!value || value.type === "none") {
      setSelectedType("none");
      setInterval(1);
      setSelectedDays([]);
      setCustomFrequency("weekly");
      return;
    }

    // 기본 옵션(daily, weekdays, weekly, monthly)은 해당 타입으로 설정
    if (value.type !== "custom") {
      setSelectedType(value.type);
      setInterval(1);
      setSelectedDays([]);
      setCustomFrequency("weekly");
      return;
    }

    // custom 타입인 경우
    setSelectedType("custom");
    setInterval(value.interval || 1);
    setSelectedDays(value.daysOfWeek || []);

    // daysOfWeek가 있으면 weekly, 없으면 기본 daily
    if (value.daysOfWeek && value.daysOfWeek.length > 0) {
      setCustomFrequency("weekly");
    } else {
      setCustomFrequency("daily");
    }
  }, [value]);

  // 팝업이 열릴 때마다 상태 초기화 (value를 기준으로)
  React.useEffect(() => {
    if (!open) return;

    if (!value || value.type === "none") {
      setSelectedType("none");
      setInterval(1);
      setSelectedDays([]);
      setCustomFrequency("weekly");
      return;
    }

    // 기본 옵션은 해당 타입으로 설정
    if (value.type !== "custom") {
      setSelectedType(value.type);
      setInterval(1);
      setSelectedDays([]);
      setCustomFrequency("weekly");
      return;
    }

    // custom 타입인 경우
    setSelectedType("custom");
    setInterval(value.interval || 1);
    setSelectedDays(value.daysOfWeek || []);

    if (value.daysOfWeek && value.daysOfWeek.length > 0) {
      setCustomFrequency("weekly");
    } else {
      setCustomFrequency("daily");
    }
  }, [open, value]);

  const formatRepeatConfig = (config: RepeatConfig) => {
    if (config.type === "none") return "";

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
        const intervalText = config.interval || 1;

        // 요일 선택이 있는 경우 (주 단위)
        if (config.daysOfWeek && config.daysOfWeek.length > 0) {
          const dayLabels = config.daysOfWeek
            .map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.shortLabel)
            .filter(Boolean);

          if (intervalText === 1) {
            return `매주 ${dayLabels.join(", ")}`;
          } else {
            return `${intervalText}주마다 ${dayLabels.join(", ")}`;
          }
        }

        // 요일 선택이 없는 경우 (일 또는 월 단위)
        if (intervalText === 1) {
          return "매일";
        } else {
          return `${intervalText}일마다`;
        }
      default:
        return "사용자 정의";
    }
  };

  // 기본 옵션 선택 시 즉시 적용
  const handleBasicOptionSelect = (type: "daily" | "weekdays" | "weekly" | "monthly") => {
    const config: RepeatConfig = { type };
    onChange?.(config);
    setOpen(false);
  };

  // 사용자 정의 적용
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

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.(undefined);
    setSelectedType("none");
    setSelectedDays([]);
    setInterval(1);
    setCustomFrequency("weekly");
    setOpen(false);
  };

  const toggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  // 사용자 정의 옵션 클릭 시
  const handleCustomOptionClick = () => {
    setSelectedType("custom");
    // 초기값 설정
    setInterval(1);
    setCustomFrequency("weekly");
    setSelectedDays([]);
  };

  const repeatContent = (
    <div className="w-56 p-3 space-y-3">
      {/* 반복 유형 선택 */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100">
          반복 설정
        </h4>
        <div className="space-y-1">
          {REPEAT_OPTIONS.map((option) => (
            <Button
              key={option.type}
              variant="ghost"
              size="sm"
              onClick={() => {
                if (option.type === "custom") {
                  handleCustomOptionClick();
                } else {
                  handleBasicOptionSelect(option.type);
                }
              }}
              className={cn(
                "w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800 text-xs h-7",
                selectedType === option.type &&
                  "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 사용자 정의 설정 */}
      {selectedType === "custom" && (
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* 반복 주기 + 반복 단위 (한 줄) */}
          <div className="flex items-center gap-2">
            {/* 반복 주기 입력 */}
            <input
              type="number"
              min="1"
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 text-center text-sm px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />

            {/* 반복 단위 선택 (select) */}
            <select
              value={customFrequency}
              onChange={(e) => {
                const newFreq = e.target.value as "daily" | "weekly" | "monthly";
                setCustomFrequency(newFreq);
                // 주가 아닌 경우 요일 선택 초기화
                if (newFreq !== "weekly") {
                  setSelectedDays([]);
                }
              }}
              className="flex-1 text-sm px-2 py-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {CUSTOM_FREQUENCY_OPTIONS.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </div>

          {/* 주간 반복 시 요일 선택 */}
          {customFrequency === "weekly" && (
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                요일 선택
              </h5>
              <div className="grid grid-cols-4 gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "h-7 w-full text-xs border-gray-200 dark:border-gray-700 px-1",
                      selectedDays.includes(day.value) &&
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                    )}
                  >
                    {day.shortLabel}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 적용/취소 버튼 */}
          <div className="flex gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedType("none");
                setOpen(false);
              }}
              className="flex-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs h-7"
            >
              취소
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCustomApply}
              className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs h-7"
            >
              적용
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full flex items-center gap-2">
      <Popover
        open={open}
        onOpenChange={setOpen}
        content={repeatContent}
        align="start"
        triggerClassName="flex-1"
      >
        <button
          className={cn(
            "flex items-center gap-3 flex-1 px-0 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors text-sm",
            value && value.type !== "none" ? "text-blue-500" : "text-gray-700 dark:text-gray-300",
            disabled && "opacity-50 pointer-events-none",
            className
          )}
          disabled={disabled}
        >
          <Repeat className={cn("w-4 h-4 flex-shrink-0", value && value.type !== "none" ? "text-blue-500" : "text-gray-500 dark:text-gray-400")} />
          <span className="flex-1">
            {value && value.type !== "none"
              ? formatRepeatConfig(value)
              : placeholder}
          </span>
        </button>
      </Popover>
      {value && value.type !== "none" && (
        <button
          onClick={handleClear}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          type="button"
        >
          <X className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
        </button>
      )}
    </div>
  );
}
