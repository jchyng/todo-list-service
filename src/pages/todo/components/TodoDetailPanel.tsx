import { useMemo } from "react";
import { X, Trash2, Check, Star, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datepicker";
import { RepeatPicker } from "@/components/ui/repeat-picker";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { EditableTitle } from "./EditableTitle";
import { EditableDescription } from "./EditableDescription";
import type { TodoItem, RepeatConfig } from "@/types/todoItem";
import { convertRepeatConfigToRecurrenceRule } from "@/services/recurrence/converters";

interface TodoDetailPanelProps {
  item: TodoItem | null;
  onClose: () => void;
  onUpdate: (
    id: number,
    data: {
      title?: string;
      description?: string;
      due_date?: string | null;
      scheduled_date?: string | null;
      is_completed?: boolean;
      is_important?: boolean;
      repeat_config?: RepeatConfig | null;
    }
  ) => void;
  onDelete: (id: number) => void;
}

export default function TodoDetailPanel({
  item,
  onClose,
  onUpdate,
  onDelete,
}: TodoDetailPanelProps) {
  // 안정적인 key 생성 (item.id + repeat_config로 고유성 보장)
  const repeatConfigKey = useMemo(() => {
    if (!item) return 'no-item';
    if (!item.repeat_config) return `${item.id}-none`;
    return `${item.id}-${JSON.stringify(item.repeat_config)}`;
  }, [item]);

  if (!item) return null;

  const handleSaveTitle = (title: string) => {
    if (title.trim() === "") {
      toast.error("제목을 입력해주세요");
      return;
    }
    onUpdate(item.id, { title });
  };

  const handleSaveDescription = (description: string) => {
    onUpdate(item.id, { description: description || undefined });
  };

  const handleDelete = () => {
    if (window.confirm("이 할 일을 삭제하시겠습니까?")) {
      onDelete(item.id);
      onClose();
    }
  };

  const handleToggleComplete = () => {
    onUpdate(item.id, { is_completed: !item.is_completed });
  };

  const handleToggleImportant = () => {
    onUpdate(item.id, { is_important: !item.is_important });
  };

  const handleToggleMyDay = () => {
    const today = new Date().toISOString().split("T")[0];
    const newValue = item.scheduled_date === today ? null : today;
    onUpdate(item.id, { scheduled_date: newValue });
  };

  const isAddedToMyDay = () => {
    const today = new Date().toISOString().split("T")[0];
    return item.scheduled_date === today;
  };

  const handleDueDateChange = (date: Date | undefined) => {
    if (date === undefined) {
      // 기한 삭제
      onUpdate(item.id, { due_date: null });
    } else {
      const dueDateString = date.toISOString().split("T")[0];
      onUpdate(item.id, { due_date: dueDateString });
    }
  };

  const handleRepeatChange = async (config: RepeatConfig | undefined) => {
    try {
      if (config === undefined) {
        // 반복 삭제
        onUpdate(item.id, { repeat_config: null });
      } else {
        // 변환 가능 여부 검증 (none 타입이 아닌 경우만)
        if (config.type !== 'none') {
          convertRepeatConfigToRecurrenceRule(config);
        }
        onUpdate(item.id, { repeat_config: config });
      }
    } catch (error) {
      logger.error("Failed to convert repeat config", "TodoDetailPanel", { error, config });
      toast.error("반복 설정 변환에 실패했습니다");
    }
  };

  return (
    <div className="h-full  border-gray-200 dark:border-gray-700 flex flex-col animate-in slide-in-from-right duration-300 ease-out">
      {/* Header */}
      <div className="flex items-center justify-end p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4">
        {/* Title with Completion Circle and Star */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleComplete}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-all duration-200 flex-shrink-0 p-0",
                item.is_completed
                  ? "bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
                  : "border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
              )}
            >
              {item.is_completed && <Check className="w-3 h-3" />}
            </Button>

            <div className="flex-1 min-w-0">
              <EditableTitle
                value={item.title}
                onSave={handleSaveTitle}
                isCompleted={item.is_completed}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleImportant}
              className="h-5 w-5 flex-shrink-0 p-0"
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  item.is_important
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
                )}
              />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Add to My Day */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-0">
            <div className="w-full flex items-center gap-2">
              <button
                className={cn(
                  "flex items-center gap-3 flex-1 px-0 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors text-sm",
                  isAddedToMyDay()
                    ? "text-blue-500"
                    : "text-gray-700 dark:text-gray-300"
                )}
                onClick={handleToggleMyDay}
              >
                <Sun
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isAddedToMyDay()
                      ? "text-blue-500"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                />
                <span className="flex-1">
                  {isAddedToMyDay()
                    ? "오늘 할 일에 추가됨"
                    : "오늘 할 일에 추가"}
                </span>
              </button>
              {isAddedToMyDay() && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleMyDay();
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
                </button>
              )}
            </div>
          </div>

          {/* Set Due Date */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-0">
            <DatePicker
              selected={item.due_date ? new Date(item.due_date) : undefined}
              onSelect={handleDueDateChange}
              placeholder="기한 설정"
              className="w-full text-left border-none h-auto shadow-none text-sm rounded-lg transition-colors"
            />
          </div>

          {/* Repeat */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-0">
            <RepeatPicker
              key={repeatConfigKey}
              value={item.repeat_config}
              onChange={handleRepeatChange}
              placeholder="반복 설정"
              className="w-full text-left border-none h-auto shadow-none text-sm rounded-lg transition-colors"
            />
          </div>
        </div>

        {/* Note/Description Section */}
        <EditableDescription
          value={item.description || ""}
          onSave={handleSaveDescription}
        />
      </div>

      {/* Footer with creation date and delete */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {item.created_at && new Date(item.created_at).toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })}{" "}
          생성됨
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="h-6 w-6 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
