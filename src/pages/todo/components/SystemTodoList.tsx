import { useState, useEffect, useOptimistic, startTransition } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import TodoItemComponent from "./TodoItem";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { updateTodoItem } from "@/services/todoItemService";
import {
  getTodayTodoItems,
  getImportantTodoItems,
} from "@/services/systemTodoService";
import type { TodoItem } from "@/types/todoItem";

interface SystemTodoListProps {
  virtualId: string; // "today" | "important"
  className?: string;
  selectedItemId?: number | null;
  selectedItem?: TodoItem | null;
  onSelectItem?: (id: number | null) => void;
  onToggleComplete?: (id: number, isCompleted: boolean) => void;
  onToggleImportant?: (id: number, isImportant: boolean) => void;
  onItemUpdate?: (updatedItem: TodoItem) => void;
}

type OptimisticAction =
  | { type: "UPDATE"; id: number; updates: Partial<TodoItem> }
  | { type: "TOGGLE"; id: number; isCompleted: boolean };

export default function SystemTodoList({
  virtualId,
  className,
  selectedItemId,
  selectedItem,
  onSelectItem,
  onToggleComplete: externalOnToggleComplete,
  onToggleImportant: externalOnToggleImportant,
  onItemUpdate
}: SystemTodoListProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<TodoItem[]>([]);
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (state: TodoItem[], action: OptimisticAction): TodoItem[] => {
      switch (action.type) {
        case "UPDATE":
          return state.map((item) =>
            item.id === action.id ? { ...item, ...action.updates } : item
          );
        case "TOGGLE":
          return state.map((item) =>
            item.id === action.id
              ? {
                  ...item,
                  is_completed: action.isCompleted,
                  completed_at: action.isCompleted
                    ? new Date().toISOString()
                    : undefined,
                }
              : item
          );
        default:
          return state;
      }
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 할 일 목록 불러오기
  useEffect(() => {
    const loadItems = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        let result;

        if (virtualId === "today") {
          result = await getTodayTodoItems(user.id);
        } else if (virtualId === "important") {
          result = await getImportantTodoItems(user.id);
        } else {
          setError("알 수 없는 메뉴입니다.");
          setIsLoading(false);
          return;
        }

        if (result.success) {
          setItems(result.data || []);
        } else {
          setError("할 일 목록을 불러올 수 없습니다.");
        }
      } catch {
        setError("할 일 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadItems();
  }, [user?.id, virtualId]);

  // selectedItem 변경사항을 items에 동기화
  useEffect(() => {
    if (selectedItem && selectedItemId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? selectedItem : item
        )
      );
    }
  }, [selectedItem, selectedItemId]);

  // 할 일 완료 상태 토글
  const handleToggleComplete = async (id: number, isCompleted: boolean) => {
    if (!user?.id) return;

    // 낙관적 업데이트
    startTransition(() => {
      setOptimisticItems({ type: "TOGGLE", id, isCompleted });
    });

    try {
      const result = await updateTodoItem(user.id, id, { is_completed: isCompleted });
      if (result.success && result.data) {
        // 성공 시 실제 items 업데이트
        setItems((prev) =>
          prev.map((item) => (item.id === id ? result.data! : item))
        );
        // 상위 컴포넌트에 업데이트된 아이템 알림
        onItemUpdate?.(result.data);
        // 외부 핸들러도 호출 (selectedItem 업데이트용)
        externalOnToggleComplete?.(id, isCompleted);
      } else {
        // 실패 시 롤백
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, is_completed: !isCompleted } : item
          )
        );
        toast.error("상태 변경에 실패했습니다");
      }
    } catch {
      // 에러 시 롤백
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_completed: !isCompleted } : item
        )
      );
      toast.error("상태 변경 중 오류가 발생했습니다");
    }
  };

  // 할 일 중요도 토글
  const handleToggleImportant = async (id: number, isImportant: boolean) => {
    if (!user?.id) return;

    // 낙관적 업데이트
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_important: isImportant } : item
      )
    );

    try {
      const result = await updateTodoItem(user.id, id, { is_important: isImportant });
      if (result.success && result.data) {
        // 성공 시 실제 items 업데이트
        setItems((prev) =>
          prev.map((item) => (item.id === id ? result.data! : item))
        );
        // 상위 컴포넌트에 업데이트된 아이템 알림
        onItemUpdate?.(result.data);
        // 외부 핸들러도 호출 (selectedItem 업데이트용)
        externalOnToggleImportant?.(id, isImportant);
      } else {
        // 실패 시 롤백
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, is_important: !isImportant } : item
          )
        );
        toast.error("중요도 변경에 실패했습니다");
      }
    } catch {
      // 에러 시 롤백
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_important: !isImportant } : item
        )
      );
      toast.error("중요도 변경 중 오류가 발생했습니다");
    }
  };

  const completedItems = optimisticItems.filter((item) => item.is_completed);
  const pendingItems = optimisticItems.filter((item) => !item.is_completed);

  if (isLoading) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">할 일 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="mt-2 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 할 일 목록 */}
      <div className="space-y-0">
        {/* 미완료 할 일 */}
        {pendingItems.map((item) => (
          <TodoItemComponent
            key={item.id}
            item={item}
            onToggleComplete={handleToggleComplete}
            onToggleImportant={handleToggleImportant}
            onSelect={(id) => onSelectItem?.(id)}
            isSelected={selectedItemId === item.id}
          />
        ))}

        {/* 완료된 할 일 */}
        {completedItems.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-6 mb-2 px-4">
              <span className="text-sm text-gray-500 font-medium">
                완료됨 ({completedItems.length})
              </span>
            </div>
            {completedItems.map((item) => (
              <TodoItemComponent
                key={item.id}
                item={item}
                onToggleComplete={handleToggleComplete}
                onToggleImportant={handleToggleImportant}
                onSelect={(id) => onSelectItem?.(id)}
                isSelected={selectedItemId === item.id}
              />
            ))}
          </>
        )}

        {/* 빈 상태 */}
        {optimisticItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              {virtualId === "today" ? "☀️" : "⭐"}
            </div>
            <h3 className="text-lg font-medium mb-2">
              {virtualId === "today" ? "오늘 할 일이 없습니다" : "중요한 작업이 없습니다"}
            </h3>
            <p className="text-sm text-center">
              {virtualId === "today"
                ? "작업에 '오늘 할 일' 추가를 통해 오늘 할 일을 추가해보세요"
                : "중요 표시한 작업이 여기에 표시됩니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
