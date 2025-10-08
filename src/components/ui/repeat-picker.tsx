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

const REPEAT_OPTIONS = [
  { type: "none" as const, label: "반복 안함" },
  { type: "daily" as const, label: "매일" },
  { type: "weekdays" as const, label: "평일 (월-금)" },
  { type: "weekly" as const, label: "매주" },
  { type: "monthly" as const, label: "매월" },
  { type: "yearly" as const, label: "매년" },
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
  const [interval, setInterval] = React.useState(value?.interval || 1);
  const [selectedDays, setSelectedDays] = React.useState<number[]>(
    value?.daysOfWeek || []
  );

  // value prop이 변경될 때 로컬 상태 동기화
  React.useEffect(() => {
    setSelectedType(value?.type || "none");
    setInterval(value?.interval || 1);
    setSelectedDays(value?.daysOfWeek || []);
  }, [value]);

  const formatRepeatConfig = (config: RepeatConfig) => {
    if (config.type === "none") return "";

    switch (config.type) {
      case "daily":
        return config.interval === 1 ? "매일" : `${config.interval}일마다`;
      case "weekdays":
        return config.interval === 1 ? "평일 (월-금)" : `${config.interval}주마다 평일`;
      case "weekly":
        if (config.daysOfWeek && config.daysOfWeek.length > 0) {
          const dayLabels = config.daysOfWeek
            .map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.shortLabel)
            .filter(Boolean);
          return `매주 ${dayLabels.join(", ")}`;
        }
        return config.interval === 1 ? "매주" : `${config.interval}주마다`;
      case "monthly":
        return config.interval === 1 ? "매월" : `${config.interval}개월마다`;
      case "yearly":
        return config.interval === 1 ? "매년" : `${config.interval}년마다`;
      default:
        return "사용자 정의";
    }
  };

  const handleApply = () => {
    if (selectedType === "none") {
      onChange?.(undefined);
    } else {
      const config: RepeatConfig = {
        type: selectedType,
        interval: interval,
      };

      // 주간 반복일 때 선택된 요일 추가
      if (selectedType === "weekly" && selectedDays.length > 0) {
        config.daysOfWeek = selectedDays;
      }

      onChange?.(config);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.(undefined);
    setSelectedType("none");
    setSelectedDays([]);
    setInterval(1);
    setOpen(false);
  };

  const toggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const repeatContent = (
    <div className="w-80 p-3 space-y-3">
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
              onClick={() => setSelectedType(option.type)}
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

      {/* 주간 반복 시 요일 선택 */}
      {selectedType === "weekly" && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">
            반복할 요일
          </h5>
          <div className="grid grid-cols-7 gap-1">
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

      {/* 간격 설정 (none, weekdays 제외) */}
      {selectedType !== "none" && selectedType !== "weekdays" && (
        <div className="space-y-1">
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">
            반복 간격
          </h5>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInterval(Math.max(1, interval - 1))}
              disabled={interval <= 1}
              className="h-6 w-6 p-0 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              -
            </Button>
            <span className="flex-1 text-center text-xs text-gray-700 dark:text-gray-300">
              {interval}{" "}
              {selectedType === "daily"
                ? "일"
                : selectedType === "weekly"
                ? "주"
                : selectedType === "monthly"
                ? "개월"
                : selectedType === "yearly"
                ? "년"
                : ""}
              마다
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInterval(interval + 1)}
              className="h-6 w-6 p-0 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              +
            </Button>
          </div>
        </div>
      )}

      {/* 적용/취소 버튼 */}
      <div className="flex gap-1 pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="flex-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs h-7"
        >
          취소
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleApply}
          className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-xs h-7"
        >
          적용
        </Button>
      </div>
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
