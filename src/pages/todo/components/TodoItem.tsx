import { memo } from "react";
import {
  Check,
  Star,
  FileText,
  Calendar,
  Repeat,
  Sun,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SimpleDropdown from "@/components/ui/SimpleDropdown";
import type { TodoItem } from "@/types/todoItem";
import {
  borderColorClasses,
  type TailwindColor,
} from "@/constant/TailwindColor";

interface TodoItemProps {
  item: TodoItem;
  onToggleComplete: (id: number, isCompleted: boolean) => void;
  onToggleImportant: (id: number, isImportant: boolean) => void;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  isSelected?: boolean;
  listColor?: string;
}

const TodoItemComponent = memo(function TodoItemComponent({
  item,
  onToggleComplete,
  onToggleImportant,
  onSelect,
  onDelete,
  isSelected = false,
  listColor,
}: TodoItemProps) {
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 버블링 방지
    onToggleComplete(item.id, !item.is_completed);
  };

  const handleToggleImportant = (e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 버블링 방지
    onToggleImportant(item.id, !item.is_important);
  };

  const handleItemClick = () => {
    onSelect(item.id);
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  // 오늘 할 일 판단 함수
  const isMyDay = () => {
    const today = new Date().toISOString().split("T")[0];
    return item.scheduled_date === today || item.due_date === today;
  };

  const formatDueDate = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday = dueDate.toDateString() === today.toDateString();
    const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();
    const isPast = dueDate < today && !isToday;

    if (isToday) return { text: "오늘", isPast: false };
    if (isTomorrow) return { text: "내일", isPast: false };

    const daysDiff = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (isPast) {
      return {
        text: dueDate.toLocaleDateString("ko-KR", {
          month: "short",
          day: "numeric",
        }),
        isPast: true,
      };
    }

    if (daysDiff <= 7) {
      return {
        text: dueDate.toLocaleDateString("ko-KR", { weekday: "short" }),
        isPast: false,
      };
    }

    return {
      text: dueDate.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      }),
      isPast: false,
    };
  };

  const dueDateInfo = item.due_date ? formatDueDate(item.due_date) : null;

  // 추가 정보 존재 여부 확인
  const hasMetadata =
    dueDateInfo ||
    isMyDay() ||
    (item.repeat_config && item.repeat_config.type !== "none") ||
    item.description;

  // 선택된 아이템의 테두리 색상 결정
  const getSelectedBorderClass = () => {
    if (!isSelected) return "";
    if (listColor && listColor in borderColorClasses) {
      return borderColorClasses[listColor as TailwindColor];
    }
    return "border-blue-300 dark:border-blue-600";
  };

  return (
    <SimpleDropdown
      triggerType="contextmenu"
      menuItems={[
        {
          label: "삭제",
          icon: <Trash2 className="w-4 h-4" />,
          onClick: handleDelete,
          variant: "destructive",
        },
      ]}
    >
      <div
        onClick={handleItemClick}
        className={cn(
          "group flex items-center gap-2.5 px-3 mb-1 rounded-md cursor-pointer transition-all duration-200",
          hasMetadata ? "py-2" : "py-2.5",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
          "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600",
          isSelected && `${getSelectedBorderClass()} shadow-sm`,
          item.is_completed && "opacity-60"
        )}
        role="button"
        tabIndex={0}
        aria-selected={isSelected}
        aria-label={`할 일: ${item.title}${
          item.is_completed ? " (완료됨)" : ""
        }${item.is_important ? ", 중요" : ""}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleItemClick();
          }
        }}
      >
        {/* Completion Checkbox */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleComplete}
          className={cn(
            "w-4 h-4 rounded-full border-2 transition-all duration-200 hover:scale-110 flex-shrink-0",
            item.is_completed
              ? "bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
              : "border-gray-400 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-500 dark:hover:border-blue-400 dark:hover:bg-blue-900/30"
          )}
          aria-label={
            item.is_completed
              ? `${item.title} 완료 취소`
              : `${item.title} 완료 처리`
          }
          type="button"
        >
          {item.is_completed && <Check className="w-2.5 h-2.5" />}
        </Button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={cn(
              "text-sm font-medium leading-snug",
              item.is_completed &&
                "line-through text-gray-500 dark:text-gray-400",
              !item.is_completed && "text-gray-900 dark:text-gray-50"
            )}
          >
            {item.title}
          </h3>

          {/* Description text below title */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
            {/* Due date */}
            {dueDateInfo && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{dueDateInfo.text}</span>
              </div>
            )}

            {/* My Day indicator */}
            {isMyDay() && (
              <>
                {dueDateInfo && <span>·</span>}
                <Sun className="w-3 h-3" />
              </>
            )}

            {/* Repeat indicator */}
            {item.repeat_config && item.repeat_config.type !== "none" && (
              <>
                {(dueDateInfo || isMyDay()) && <span>·</span>}
                <Repeat className="w-3 h-3" />
              </>
            )}

            {/* Note indicator */}
            {item.description && (
              <>
                {(dueDateInfo ||
                  isMyDay() ||
                  (item.repeat_config &&
                    item.repeat_config.type !== "none")) && <span>·</span>}
                <FileText className="w-3 h-3" />
              </>
            )}
          </div>
        </div>

        {/* Important Star */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleImportant}
          className={cn(
            "w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
            item.is_important && "opacity-100",
            "hover:scale-110"
          )}
          aria-label={
            item.is_important
              ? `${item.title} 중요도 제거`
              : `${item.title} 중요도 설정`
          }
          type="button"
        >
          <Star
            className={cn(
              "w-3.5 h-3.5 transition-all duration-200",
              item.is_important
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-400 hover:text-yellow-400"
            )}
          />
        </Button>
      </div>
    </SimpleDropdown>
  );
});

export default TodoItemComponent;
