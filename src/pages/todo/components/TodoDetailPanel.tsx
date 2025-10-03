import { X, Trash2, Check, Star, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datepicker";
import { RepeatPicker } from "@/components/ui/repeat-picker";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
import { EditableTitle } from "./EditableTitle";
import { EditableDescription } from "./EditableDescription";
import type { TodoItem, RepeatConfig } from "@/types/todoItem";

interface TodoDetailPanelProps {
  item: TodoItem | null;
  onClose: () => void;
  onUpdate: (
    id: number,
    data: {
      title?: string;
      description?: string;
      due_date?: string;
      added_to_my_day_date?: string | null;
      is_completed?: boolean;
      is_important?: boolean;
      repeat_config?: RepeatConfig;
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
    const newValue = item.added_to_my_day_date === today ? null : today;
    onUpdate(item.id, { added_to_my_day_date: newValue });
  };

  const isAddedToMyDay = () => {
    const today = new Date().toISOString().split("T")[0];
    return item.added_to_my_day_date === today;
  };

  const handleDueDateChange = (date: Date | undefined) => {
    const dueDateString = date ? date.toISOString().split("T")[0] : undefined;
    onUpdate(item.id, { due_date: dueDateString });
  };

  const handleRepeatChange = (config: RepeatConfig | undefined) => {
    // undefined인 경우 none 타입으로 변환하여 반복 제거
    const repeatConfig = config || { type: "none" as const };
    onUpdate(item.id, { repeat_config: repeatConfig });
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col animate-in slide-in-from-right duration-300 ease-out">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-3">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={handleToggleMyDay}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg transition-colors group",
                isAddedToMyDay() && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              <Sun
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isAddedToMyDay()
                    ? "text-blue-500 fill-blue-500"
                    : "text-gray-500 dark:text-gray-400"
                )}
              />
              <span
                className={cn(
                  "text-sm group-hover:text-blue-500",
                  isAddedToMyDay()
                    ? "text-blue-500 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {isAddedToMyDay() ? "나의 하루에서 제거" : "나의 하루에 추가"}
              </span>
            </button>
          </div>

          {/* Set Due Date */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <DatePicker
              selected={item.due_date ? new Date(item.due_date) : undefined}
              onSelect={handleDueDateChange}
              placeholder="기한 설정"
              className="w-full px-3 py-3 text-left border-none h-auto shadow-none text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:text-blue-500 rounded-lg transition-colors"
            />
          </div>

          {/* Repeat */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <RepeatPicker
              value={item.repeat_config}
              onChange={handleRepeatChange}
              placeholder="반복 설정"
              className="w-full px-3 py-3 text-left border-none h-auto shadow-none text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 hover:text-blue-500 rounded-lg transition-colors"
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
          {new Date(item.created_at).toLocaleDateString("ko-KR", {
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
