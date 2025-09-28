import { useState } from "react";
import type { SystemMenuProps } from "@/data/SidebarMenuData";
import { colorClasses, type TailwindColor } from "@/constant/TailwindColor";
import { useTodoMenuContext } from "@/contexts/TodoMenuContext";
import { useAuth } from "@/hooks/useAuth";
import ColorPicker from "./ColorPicker";

interface ListData {
  id: number;
  name: string;
  color: string | null;
  is_system: boolean;
}

interface ContentHeaderProps {
  type: "system" | "list" | "none" | "unknown";
  systemMenu?: SystemMenuProps;
  listData?: ListData;
  onColorUpdate?: (newData: ListData) => void;
}

export default function ContentHeader({
  type,
  systemMenu,
  listData,
  onColorUpdate,
}: ContentHeaderProps) {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const { updateMenuColor } = useTodoMenuContext();
  const { user } = useAuth();

  const handleColorSelect = async (color: TailwindColor) => {
    if (listData && user?.id) {
      // 로컬 상태 즉시 업데이트 (낙관적 업데이트)
      if (onColorUpdate) {
        const updatedData = { ...listData, color };
        onColorUpdate(updatedData);
      }

      try {
        // Context를 통해 사이드바와 동기화
        await updateMenuColor(listData.id, color, user.id);
      } catch (error) {
        // 실패 시 원래 색상으로 롤백 (Context에서 처리됨)
        console.error("색상 업데이트 실패:", error);
      }
    }
  };

  const handleColorDotClick = () => {
    if (type === "list" && listData) {
      setIsColorPickerOpen(true);
    }
  };

  if (type === "none" || type === "unknown") {
    return (
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">할 일</h1>
      </div>
    );
  }

  if (type === "system" && systemMenu) {
    const Icon = systemMenu.icon;
    return (
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-semibold text-gray-900">
            {systemMenu.text}
          </h1>
        </div>
      </div>
    );
  }

  if (type === "list" && listData) {
    const colorClass = listData.color
      ? colorClasses[listData.color as TailwindColor]
      : "bg-gray-500";

    return (
      <div className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <button
              onClick={handleColorDotClick}
              className={`w-4 h-4 rounded-full ${colorClass} hover:scale-110 transition-transform cursor-pointer`}
              title="색상 변경"
            />
            <ColorPicker
              currentColor={listData.color}
              onColorSelect={handleColorSelect}
              onClose={() => setIsColorPickerOpen(false)}
              isOpen={isColorPickerOpen}
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {listData.name}
          </h1>
        </div>
      </div>
    );
  }

  return null;
}
