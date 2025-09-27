import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import Sidebar from "./components/Sidebar";
import { systemMenus } from "@/data/SidebarMenuData";

export default function TodoPage() {
  const { listId } = useParams();

  // listId가 가상 메뉴인지 실제 리스트인지 판단
  const getMenuType = (id: string | undefined) => {
    if (!id) return { type: 'none', data: null };

    // 숫자인지 확인 (실제 리스트 ID)
    if (!isNaN(Number(id))) {
      return { type: 'list', data: { id: Number(id) } };
    }

    // 가상 메뉴인지 확인
    const systemMenu = systemMenus.find(menu => menu.virtualId === id);
    if (systemMenu) {
      return { type: 'system', data: systemMenu };
    }

    return { type: 'unknown', data: null };
  };

  const menuInfo = getMenuType(listId);

  const renderContent = () => {
    switch (menuInfo.type) {
      case 'system':
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {menuInfo.data.text}
            </h1>
            <p className="text-muted-foreground">
              {menuInfo.data.isVirtual
                ? `가상 메뉴: ${menuInfo.data.text}`
                : `실제 리스트: ${menuInfo.data.text}`
              }
            </p>
          </div>
        );
      case 'list':
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              사용자 리스트
            </h1>
            <p className="text-muted-foreground">
              List ID: {menuInfo.data.id}
            </p>
          </div>
        );
      case 'none':
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">
              Todo 애플리케이션
            </h1>
            <p className="text-muted-foreground">
              사이드바에서 메뉴를 선택해주세요
            </p>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground text-red-500">
              존재하지 않는 메뉴
            </h1>
            <p className="text-muted-foreground">
              {listId}는 존재하지 않는 메뉴입니다.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="max-w-7xl mx-auto px-4 flex items-center justify-center flex-1 h-[calc(100vh-64px)]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
