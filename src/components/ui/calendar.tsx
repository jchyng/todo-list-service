import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  disabled?: (date: Date) => boolean;
}

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTHS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
];

export function Calendar({ selected, onSelect, className, disabled }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(selected || new Date());

  const today = new Date();
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  // 해당 월의 첫째 날
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

  // 캘린더 시작일 (이전 달 날짜 포함)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  // 캘린더에 표시할 날짜들 생성 (6주 = 42일)
  const calendarDays: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    calendarDays.push(date);
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isSelected = (date: Date) => {
    return selected &&
           date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  };

  const isToday = (date: Date) => {
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  const isDisabled = (date: Date) => {
    return disabled ? disabled(date) : false;
  };

  return (
    <div className={cn("p-2", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth("prev")}
          className="h-6 w-6"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        <div className="text-sm font-medium">
          {currentYear}년 {MONTHS[currentMonth]}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth("next")}
          className="h-6 w-6"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((day) => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const disabled = isDisabled(date);

          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => !disabled && onSelect?.(date)}
              disabled={disabled}
              className={cn(
                "h-7 w-7 p-0 text-xs font-normal",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                !isCurrentMonth(date) && "text-gray-400 dark:text-gray-600",
                isSelected(date) && "bg-blue-500 text-white hover:bg-blue-600",
                isToday(date) && !isSelected(date) && "bg-gray-100 dark:bg-gray-800 font-medium",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
              )}
            >
              {date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}