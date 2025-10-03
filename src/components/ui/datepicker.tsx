import * as React from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover } from "./popover";
import { Calendar } from "./calendar";

interface DatePickerProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DatePicker({
  selected,
  onSelect,
  placeholder = "날짜 선택",
  className,
  disabled = false,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return "오늘";
    if (isTomorrow) return "내일";

    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    onSelect?.(date);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(undefined);
  };

  const calendarContent = (
    <div className="w-64">
      <Calendar selected={selected} onSelect={handleDateSelect} />

      {/* 빠른 선택 버튼들 */}
      <div className="flex gap-1 p-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDateSelect(new Date())}
          className="flex-1 text-xs h-7"
        >
          오늘
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            handleDateSelect(tomorrow);
          }}
          className="flex-1 text-xs h-7"
        >
          내일
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            handleDateSelect(nextWeek);
          }}
          className="flex-1 text-xs h-7"
        >
          다음 주
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={calendarContent}
      align="start"
    >
      <button
        className={cn(
          "w-full flex items-center gap-3 px-0 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors text-sm",
          !selected && "text-gray-500",
          disabled && "opacity-50 pointer-events-none",
          className
        )}
        disabled={disabled}
      >
        <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span className="flex-1">
          {selected ? formatDate(selected) : placeholder}
        </span>
        {selected && clearable && (
          <X
            className="h-4 w-4 opacity-50 hover:opacity-100"
            onClick={handleClear}
          />
        )}
      </button>
    </Popover>
  );
}
