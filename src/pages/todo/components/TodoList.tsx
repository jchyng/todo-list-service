import {
  useState,
  useEffect,
  useOptimistic,
  useCallback,
  startTransition,
} from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TodoItemComponent from "./TodoItem";
import { useAuth } from "@/hooks/useAuth";
import { useTodoMenuContext } from "@/contexts/TodoMenuContext";
import { toast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import {
  getTodoItems,
  createTodoItem,
  updateTodoItem,
  deleteTodoItem,
} from "@/services/todoItem";
import type { TodoItem, TodoItemWithOptimistic } from "@/types/todoItem";

interface TodoListProps {
  listId: number;
  className?: string;
  selectedItemId?: number | null;
  selectedItem?: TodoItem | null;
  onSelectItem?: (id: number | null) => void;
  onToggleComplete?: (id: number, isCompleted: boolean) => void;
  onToggleImportant?: (id: number, isImportant: boolean) => void;
  onItemUpdate?: (updatedItem: TodoItem) => void;
  listColor?: string;
}

type OptimisticAction =
  | { type: "ADD"; item: TodoItemWithOptimistic }
  | { type: "UPDATE"; id: number; updates: Partial<TodoItem> }
  | { type: "DELETE"; id: number }
  | { type: "TOGGLE"; id: number; isCompleted: boolean };

export default function TodoList({
  listId,
  className,
  selectedItemId,
  selectedItem,
  onSelectItem,
  onToggleComplete: externalOnToggleComplete,
  onToggleImportant: externalOnToggleImportant,
  onItemUpdate,
  listColor,
}: TodoListProps) {
  const { user } = useAuth();
  const { loadSystemMenuCounts } = useTodoMenuContext();
  const [items, setItems] = useState<TodoItem[]>([]);
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    items,
    (state: TodoItem[], action: OptimisticAction): TodoItem[] => {
      switch (action.type) {
        case "ADD":
          return [...state, action.item as TodoItem];
        case "UPDATE":
          return state.map((item) =>
            item.id === action.id ? { ...item, ...action.updates } : item
          );
        case "DELETE":
          return state.filter((item) => item.id !== action.id);
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
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  // 할 일 목록 불러오기
  const loadItems = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getTodoItems(user.id, listId);
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
  }, [user?.id, listId]);

  useEffect(() => {
    loadItems();
  }, [user?.id, listId, loadItems]);

  // selectedItem 변경사항을 items에 동기화
  useEffect(() => {
    if (selectedItem && selectedItemId) {
      setItems((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? selectedItem : item))
      );
    }
  }, [selectedItem, selectedItemId]);

  // 새 할 일 추가
  const handleAddItem = async () => {
    if (!user?.id || !newItemTitle.trim()) return;

    const optimisticId = Math.floor(Math.random() * -1000000); // 임시 음수 ID
    const optimisticItem: TodoItemWithOptimistic = {
      id: optimisticId,
      user_id: user.id,
      list_id: listId,
      title: newItemTitle.trim(),
      description: undefined,
      is_completed: false,
      is_important: false,
      position: "end",
      due_date: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _isOptimistic: true,
    };

    startTransition(() => {
      setOptimisticItems({ type: "ADD", item: optimisticItem });
    });
    setNewItemTitle("");
    setIsAddingItem(true);

    try {
      const result = await createTodoItem(user.id, {
        list_id: listId,
        title: newItemTitle.trim(),
      });

      if (result.success) {
        // 실제 데이터로 교체
        setItems((prev) => [...prev, result.data!]);
        toast.success("할 일이 추가되었습니다");
      } else {
        // 낙관적 업데이트 롤백
        setItems((prev) => prev.filter((item) => item.id !== optimisticId));
        toast.error("할 일 추가에 실패했습니다");
      }
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== optimisticId));
      toast.error("할 일 추가 중 오류가 발생했습니다");
    } finally {
      setIsAddingItem(false);
    }
  };

  // 할 일 완료 상태 토글
  const handleToggleComplete = async (id: number, isCompleted: boolean) => {
    if (!user?.id) return;

    // 낙관적 업데이트 (항상 실행)
    startTransition(() => {
      setOptimisticItems({ type: "TOGGLE", id, isCompleted });
    });

    try {
      const result = await updateTodoItem(user.id, id, {
        is_completed: isCompleted,
      });
      if (result.success && result.data) {
        // 성공 시 실제 items 업데이트
        setItems((prev) =>
          prev.map((item) => (item.id === id ? result.data! : item))
        );
        // 상위 컴포넌트에 업데이트된 아이템 알림 (항상 호출)
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

    // 낙관적 업데이트 (항상 실행)
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_important: isImportant } : item
      )
    );

    try {
      const result = await updateTodoItem(user.id, id, {
        is_important: isImportant,
      });
      if (result.success && result.data) {
        // 성공 시 실제 items 업데이트
        setItems((prev) =>
          prev.map((item) => (item.id === id ? result.data! : item))
        );
        // 상위 컴포넌트에 업데이트된 아이템 알림 (항상 호출)
        onItemUpdate?.(result.data);
        // 외부 핸들러도 호출 (selectedItem 업데이트용)
        externalOnToggleImportant?.(id, isImportant);
        // 시스템 메뉴 카운트 새로고침
        loadSystemMenuCounts(user.id);
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

  // 할 일 삭제
  const handleDelete = async (id: number) => {
    if (!user?.id) return;

    // 낙관적 업데이트 (즉시 UI에서 제거)
    startTransition(() => {
      setOptimisticItems({ type: "DELETE", id });
    });

    // 선택된 아이템이 삭제되는 경우 선택 해제
    if (selectedItemId === id) {
      onSelectItem?.(null);
    }

    try {
      const result = await deleteTodoItem(user.id, id);
      if (result.success) {
        // 성공 시 실제 items 업데이트
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("할 일이 삭제되었습니다");
        // 시스템 메뉴 카운트 새로고침
        loadSystemMenuCounts(user.id);
      } else {
        // 실패 시 롤백
        loadItems();
        toast.error("삭제에 실패했습니다");
      }
    } catch {
      // 에러 시 롤백
      loadItems();
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newItemTitle.trim()) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const completedItems = optimisticItems.filter((item) => item.is_completed);
  const pendingItems = optimisticItems.filter((item) => !item.is_completed);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12",
          className
        )}
      >
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">
          할 일 목록을 불러오는 중...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-12",
          className
        )}
      >
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="mt-2 text-sm text-red-500">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadItems}
          className="mt-4"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* 할 일 추가 입력 */}
      <div className="flex gap-2">
        <Input
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새 할 일을 입력하세요..."
          disabled={isAddingItem}
          className="flex-1 bg-white dark:bg-gray-900"
        />
        <Button
          onClick={handleAddItem}
          disabled={!newItemTitle.trim() || isAddingItem}
          size="default"
        >
          {isAddingItem ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          추가
        </Button>
      </div>

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
            onDelete={handleDelete}
            isSelected={selectedItemId === item.id}
            listColor={listColor}
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
                onDelete={handleDelete}
                isSelected={selectedItemId === item.id}
                listColor={listColor}
              />
            ))}
          </>
        )}

        {/* 빈 상태 */}
        {optimisticItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium mb-2">할 일이 없습니다</h3>
            <p className="text-sm text-center">새로운 할 일을 추가해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
