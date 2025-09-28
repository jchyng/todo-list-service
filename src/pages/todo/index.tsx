import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import Sidebar from "./components/Sidebar";
import ContentHeader from "./components/ContentHeader";
import { systemMenus, type SystemMenuProps } from "@/data/SidebarMenuData";
import { getListById, updateListColor } from "@/services/todoMenuService";
import { useAuth } from "@/hooks/useAuth";
import { TodoMenuProvider } from "@/contexts/TodoMenuContext";
import type { TailwindColor } from "@/constant/TailwindColor";

export default function TodoPage() {
  const { listId } = useParams();
  const { user } = useAuth();
  const [listData, setListData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  // ContentHeader props를 안전하게 생성하는 헬퍼 함수
  const getContentHeaderProps = () => ({
    type: menuInfo.type as "system" | "list" | "none" | "unknown",
    systemMenu: menuInfo.type === "system" ? menuInfo.data as SystemMenuProps : undefined,
    listData: menuInfo.type === "list" ? listData as any : undefined,
    onColorUpdate: handleColorUpdate,
  });

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
  const handleColorUpdate = async (newData: any) => {
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

  return (
    <TodoMenuProvider userId={user?.id}>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 h-[calc(100vh-64px)]">
            <ContentHeader {...getContentHeaderProps()} />
            <div className="px-6 py-4">
              {isLoading && <div className="text-gray-500">로딩 중...</div>}
              {/* TODO: 할 일 목록 컴포넌트 추가 */}
            </div>
          </main>
        </div>
      </div>
    </TodoMenuProvider>
  );
}
