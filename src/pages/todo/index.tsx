import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import Sidebar from "./components/Sidebar";
import ContentHeader from "./components/ContentHeader";
import TodoList from "./components/TodoList";
import SystemTodoList from "./components/SystemTodoList";
import TodoDetailPanel from "./components/TodoDetailPanel";
import { systemMenus, type SystemMenuProps } from "@/data/SidebarMenuData";
import { getListById, updateListColor } from "@/services/todoMenuService";
import { updateTodoItem, deleteTodoItem, getTodoItems, getSystemList, getTodayTodoItems, getImportantTodoItems } from "@/services/todoItemService";
import { useAuth } from "@/hooks/useAuth";
import { TodoMenuProvider } from "@/contexts/TodoMenuContext";
import { cn } from "@/lib/utils";
import type { TailwindColor } from "@/constant/TailwindColor";
import type { TodoItem } from "@/types/todoItem";

export default function TodoPage() {
  const { listId } = useParams();
  const { user } = useAuth();
  const [listData, setListData] = useState(null);
  const [systemListId, setSystemListId] = useState<number | null>(null); // "작업" 메뉴의 실제 list ID
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null);

  // listId가 가상 메뉴인지 실제 리스트인지 판단
  const getMenuType = (id: string | undefined) => {
    if (!id) return { type: "none", data: null };

    // 숫자인지 확인 (실제 리스트 ID)
    if (!isNaN(Number(id))) {
      return { type: "list", data: { id: Number(id) } };
    }

    // 가상 메뉴인지 확인
    const systemMenu = systemMenus.find((menu) => menu.virtualId === id);
    if (systemMenu) {
      return { type: "system", data: systemMenu };
    }

    return { type: "unknown", data: null };
  };

  const menuInfo = getMenuType(listId);

  // listId 변경 시 상세 패널 닫기
  useEffect(() => {
    setSelectedItemId(null);
    setSelectedItem(null);
  }, [listId]);

  // ContentHeader props를 안전하게 생성하는 헬퍼 함수
  const getContentHeaderProps = () => ({
    type: menuInfo.type as "system" | "list" | "none" | "unknown",
    systemMenu: menuInfo.type === "system" ? menuInfo.data as SystemMenuProps : undefined,
    listData: menuInfo.type === "list" ? listData : undefined,
    onColorUpdate: handleColorUpdate,
  });

  // "작업" 메뉴인 경우 system list ID 가져오기
  useEffect(() => {
    if (menuInfo.type === "system" && (menuInfo.data as SystemMenuProps)?.virtualId === "tasks" && user?.id) {
      setIsLoading(true);
      getSystemList(user.id)
        .then((result) => {
          if (result.success && result.data) {
            setSystemListId(result.data.id);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setSystemListId(null);
    }
  }, [menuInfo.type, menuInfo.data, user?.id]);

  // 실제 리스트인 경우 데이터 가져오기
  useEffect(() => {
    if (menuInfo.type === "list" && user?.id && menuInfo.data?.id) {
      setIsLoading(true);
      getListById(user.id, menuInfo.data.id)
        .then((result) => {
          if (result.success) {
            setListData(result.data);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setListData(null);
    }
  }, [menuInfo.type, menuInfo.data?.id, user?.id]);

  // 색상 업데이트 핸들러
  const handleColorUpdate = async (newData: { id: number; name: string; color: TailwindColor; is_system: boolean }) => {
    if (!user?.id || menuInfo.type !== "list" || !menuInfo.data?.id) return;

    // 낙관적 업데이트
    setListData(newData);

    try {
      const result = await updateListColor(user.id, menuInfo.data.id, newData.color as TailwindColor);
      if (result.success) {
        setListData(result.data);
      } else {
        // 실패 시 롤백 (원래 데이터로 복구)
        const originalResult = await getListById(user.id, menuInfo.data.id);
        if (originalResult.success) {
          setListData(originalResult.data);
        }
      }
    } catch {
      // 에러 시 롤백
      const originalResult = await getListById(user.id, menuInfo.data.id);
      if (originalResult.success) {
        setListData(originalResult.data);
      }
    }
  };

  // 선택된 아이템 로드
  const loadSelectedItem = async (itemId: number) => {
    if (!user?.id) return;

    try {
      let result;

      // system menu 처리
      if (menuInfo.type === "system") {
        const virtualId = (menuInfo.data as SystemMenuProps)?.virtualId;

        if (virtualId === "today") {
          result = await getTodayTodoItems(user.id);
        } else if (virtualId === "important") {
          result = await getImportantTodoItems(user.id);
        } else if (virtualId === "tasks" && systemListId) {
          result = await getTodoItems(user.id, systemListId);
        }
      }
      // 일반 list 처리
      else if (menuInfo.type === "list" && menuInfo.data?.id) {
        result = await getTodoItems(user.id, menuInfo.data.id);
      }

      if (result?.success && result.data) {
        const item = result.data.find(item => item.id === itemId);
        setSelectedItem(item || null);
      }
    } catch (error) {
      console.error('Failed to load selected item:', error);
    }
  };

  // 아이템 선택 핸들러
  const handleSelectItem = (itemId: number | null) => {
    setSelectedItemId(itemId);
    if (itemId) {
      loadSelectedItem(itemId);
    } else {
      setSelectedItem(null);
    }
  };

  // TodoList에서 아이템 업데이트 알림 처리
  const handleItemUpdate = (updatedItem: TodoItem) => {
    // selectedItem이 업데이트된 아이템과 같다면 동기화
    if (selectedItem && selectedItem.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }
  };

  // 할 일 완료 상태 토글 (통합 핸들러 - DetailPanel용)
  const handleToggleComplete = async (id: number, isCompleted: boolean) => {
    if (!user?.id) return;

    // 낙관적 업데이트: selectedItem 즉시 업데이트
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem({
        ...selectedItem,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
      });
    }

    try {
      const result = await updateTodoItem(user.id, id, { is_completed: isCompleted });
      if (result.success && result.data) {
        // 성공 시 selectedItem 다시 업데이트 (서버 데이터로)
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(result.data);
        }
      } else {
        // 실패 시 롤백
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem({
            ...selectedItem,
            is_completed: !isCompleted,
            completed_at: !isCompleted ? new Date().toISOString() : undefined,
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
      // 에러 시 롤백
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({
          ...selectedItem,
          is_completed: !isCompleted,
          completed_at: !isCompleted ? new Date().toISOString() : undefined,
        });
      }
    }
  };

  // 할 일 중요도 토글 (통합 핸들러 - DetailPanel용)
  const handleToggleImportant = async (id: number, isImportant: boolean) => {
    if (!user?.id) return;

    // 낙관적 업데이트: selectedItem 즉시 업데이트
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem({
        ...selectedItem,
        is_important: isImportant,
      });
    }

    try {
      const result = await updateTodoItem(user.id, id, { is_important: isImportant });
      if (result.success && result.data) {
        // 성공 시 selectedItem 다시 업데이트 (서버 데이터로)
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem(result.data);
        }
      } else {
        // 실패 시 롤백
        if (selectedItem && selectedItem.id === id) {
          setSelectedItem({
            ...selectedItem,
            is_important: !isImportant,
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle importance:', error);
      // 에러 시 롤백
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem({
          ...selectedItem,
          is_important: !isImportant,
        });
      }
    }
  };

  // 아이템 업데이트 핸들러 (제목, 설명, 기한 등)
  const handleUpdateItem = async (
    id: number,
    data: {
      title?: string;
      description?: string;
      due_date?: string;
      added_to_my_day_date?: string | null;
      is_completed?: boolean;
      is_important?: boolean;
    }
  ) => {
    if (!user?.id) return;

    // is_completed나 is_important 변경은 전용 핸들러 사용
    if (data.is_completed !== undefined) {
      return handleToggleComplete(id, data.is_completed);
    }
    if (data.is_important !== undefined) {
      return handleToggleImportant(id, data.is_important);
    }

    try {
      const result = await updateTodoItem(user.id, id, data);
      if (result.success && result.data) {
        setSelectedItem(result.data);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  // 아이템 삭제 핸들러
  const handleDeleteItem = async (id: number) => {
    if (!user?.id) return;

    try {
      const result = await deleteTodoItem(user.id, id);
      if (result.success) {
        setSelectedItemId(null);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };


  return (
    <TodoMenuProvider userId={user?.id}>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          {/* 메인 콘텐츠 영역 */}
          <div className="flex flex-1 h-[calc(100vh-64px)]">
            {/* 할 일 목록 패널 */}
            <main className={cn(
              "flex flex-col transition-all duration-300",
              selectedItemId ? "flex-1" : "flex-1"
            )}>
              <ContentHeader {...getContentHeaderProps()} />
              <div className="flex-1 overflow-hidden">
                {isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">로딩 중...</div>
                  </div>
                )}
                {!isLoading && menuInfo.type === "list" && menuInfo.data?.id && (
                  <div className="h-full overflow-y-auto">
                    <TodoList
                      listId={menuInfo.data.id}
                      selectedItemId={selectedItemId}
                      selectedItem={selectedItem}
                      onSelectItem={handleSelectItem}
                      onToggleComplete={handleToggleComplete}
                      onToggleImportant={handleToggleImportant}
                      onItemUpdate={handleItemUpdate}
                      className="px-6 py-4"
                    />
                  </div>
                )}
                {!isLoading && menuInfo.type === "system" && (
                  <>
                    {/* "작업" 메뉴: 실제 system list 렌더링 */}
                    {(menuInfo.data as SystemMenuProps)?.virtualId === "tasks" && systemListId && (
                      <div className="h-full overflow-y-auto">
                        <TodoList
                          listId={systemListId}
                          selectedItemId={selectedItemId}
                          selectedItem={selectedItem}
                          onSelectItem={handleSelectItem}
                          onToggleComplete={handleToggleComplete}
                          onToggleImportant={handleToggleImportant}
                          onItemUpdate={handleItemUpdate}
                          className="px-6 py-4"
                        />
                      </div>
                    )}
                    {/* "오늘 할 일", "중요" 메뉴: SystemTodoList 렌더링 */}
                    {((menuInfo.data as SystemMenuProps)?.virtualId === "today" ||
                      (menuInfo.data as SystemMenuProps)?.virtualId === "important") && (
                      <div className="h-full overflow-y-auto">
                        <SystemTodoList
                          virtualId={(menuInfo.data as SystemMenuProps).virtualId}
                          selectedItemId={selectedItemId}
                          selectedItem={selectedItem}
                          onSelectItem={handleSelectItem}
                          onToggleComplete={handleToggleComplete}
                          onToggleImportant={handleToggleImportant}
                          onItemUpdate={handleItemUpdate}
                          className="px-6 py-4"
                        />
                      </div>
                    )}
                  </>
                )}
                {!isLoading && menuInfo.type === "none" && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <h3 className="text-lg font-medium mb-2">할 일 목록을 선택하세요</h3>
                    <p className="text-sm">왼쪽에서 목록을 선택하거나 새로 만들어보세요</p>
                  </div>
                )}
                {!isLoading && menuInfo.type === "unknown" && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <h3 className="text-lg font-medium mb-2">목록을 찾을 수 없습니다</h3>
                    <p className="text-sm">존재하지 않거나 삭제된 목록입니다</p>
                  </div>
                )}
              </div>
            </main>

            {/* 상세 패널 */}
            {selectedItem && (
              <TodoDetailPanel
                item={selectedItem}
                onClose={() => handleSelectItem(null)}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            )}
          </div>
        </div>
      </div>
    </TodoMenuProvider>
  );
}
