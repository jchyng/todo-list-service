import { useState, useRef, useEffect } from "react";
import { X, Trash2, Check, Star, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/datepicker";
import { RepeatPicker } from "@/components/ui/repeat-picker";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/useToast";
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // 선택된 아이템이 변경될 때 편집 상태 초기화
  useEffect(() => {
    if (item) {
      setEditTitle(item.title);
      setEditDescription(item.description || "");
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  }, [item]);

  // 편집 모드 시작 시 포커스
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  if (!item) return null;

  const handleSaveTitle = () => {
    if (editTitle.trim() === "") {
      toast.error("제목을 입력해주세요");
      return;
    }

    if (editTitle.trim() !== item.title) {
      onUpdate(item.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    if (editDescription.trim() !== (item.description || "")) {
      onUpdate(item.id, { description: editDescription.trim() || undefined });
    }
    setIsEditingDescription(false);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    type: "title" | "description"
  ) => {
    if (e.key === "Enter" && type === "title") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (type === "title") {
        setEditTitle(item.title);
        setIsEditingTitle(false);
      } else {
        setEditDescription(item.description || "");
        setIsEditingDescription(false);
      }
    }
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
    const today = new Date().toISOString().split('T')[0];
    const newValue = item.added_to_my_day_date === today ? null : today;
    onUpdate(item.id, { added_to_my_day_date: newValue });
  };

  const isAddedToMyDay = () => {
    const today = new Date().toISOString().split('T')[0];
    return item.added_to_my_day_date === today;
  };

  const handleDueDateChange = (date: Date | undefined) => {
    const dueDateString = date ? date.toISOString().split("T")[0] : undefined;
    onUpdate(item.id, { due_date: dueDateString });
  };

  const handleRepeatChange = (config: RepeatConfig | undefined) => {
    // undefined인 경우 none 타입으로 변환하여 반복 제거
    const repeatConfig = config || { type: 'none' as const };
    onUpdate(item.id, { repeat_config: repeatConfig });
  };

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col animate-in slide-in-from-right duration-300 ease-out">
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
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleComplete}
            className={cn(
              "mt-0.5 w-4 h-4 rounded-full border-2 transition-all duration-200 flex-shrink-0",
              item.is_completed
                ? "bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
                : "border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-500"
            )}
          >
            {item.is_completed && <Check className="w-2.5 h-2.5" />}
          </Button>

          <div className="flex-1">
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "title")}
                onBlur={handleSaveTitle}
                className="text-base font-medium border-none p-0 h-auto shadow-none focus-visible:ring-0"
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className={cn(
                  "text-base font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors",
                  item.is_completed &&
                    "line-through text-gray-500 dark:text-gray-400"
                )}
              >
                {item.title}
              </h1>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleImportant}
            className="mt-0.5 h-5 w-5 flex-shrink-0"
          >
            <Star
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                item.is_important
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-400 hover:text-yellow-400"
              )}
            />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-1">
          {/* Add to My Day */}
          <button
            onClick={handleToggleMyDay}
            className={cn(
              "w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors group",
              isAddedToMyDay() && "bg-blue-50 dark:bg-blue-900/20"
            )}
          >
            <Sun className={cn(
              "w-4 h-4",
              isAddedToMyDay() ? "text-blue-500 fill-blue-500" : "text-blue-500"
            )} />
            <span className={cn(
              "text-sm group-hover:text-blue-500",
              isAddedToMyDay()
                ? "text-blue-500 font-medium"
                : "text-gray-700 dark:text-gray-300"
            )}>
              {isAddedToMyDay() ? "나의 하루에서 제거" : "나의 하루에 추가"}
            </span>
          </button>

          {/* Set Due Date */}
          <div className="w-full">
            <DatePicker
              selected={item.due_date ? new Date(item.due_date) : undefined}
              onSelect={handleDueDateChange}
              placeholder="기한 설정"
              className="w-full p-2 text-left border-none h-auto shadow-none text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-500 rounded-md transition-colors"
            />
          </div>

          {/* Repeat */}
          <div className="w-full">
            <RepeatPicker
              value={item.repeat_config}
              onChange={handleRepeatChange}
              placeholder="반복 설정"
              className="w-full p-2 text-left border-none h-auto shadow-none text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-500 rounded-md transition-colors"
            />
          </div>
        </div>

        {/* Note/Description Section */}
        <div className="space-y-2 flex-1">
          {/* Note/Description */}
          <div className="h-full">
            {isEditingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                onBlur={handleSaveDescription}
                placeholder="메모 추가"
                className="w-full h-full min-h-[200px] p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="w-full h-full min-h-[200px] p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {item.description ? (
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {item.description}
                  </p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500">메모 추가</p>
                )}
              </div>
            )}
          </div>
        </div>
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
