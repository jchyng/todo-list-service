import { useState, useCallback } from "react";
import GroupAddInput from "./GroupAddInput";
import ListAddInput from "./ListAddInput";
import GroupAddToggleBtn from "./GroupAddTogglBtn";
import SimpleTooltip from "@/components/ui/SimpleTooltip";
import { useAuthContext } from "@/hooks/useAuthContext";
import { createGroup, createList } from "@/services/todoMenu";
import {
  generateTempId,
  createOptimisticGroup,
  createOptimisticList,
} from "@/lib/todoMenuUtils";
import { getRandomColor } from "@/constant/TailwindColor";
import { toast } from "@/hooks/useToast";
import { menuLogger } from "@/lib/logger";

import type { UserMenuProps } from "@/data/SidebarMenuData";

interface MenuAddSectionProps {
  setUserMenus: React.Dispatch<React.SetStateAction<UserMenuProps[]>>;
}

// 에러 메시지 상수
const ERROR_MESSAGES = {
  GROUP_CREATE: "그룹 생성에 실패했습니다. 다시 시도해주세요.",
  LIST_CREATE: "목록 생성에 실패했습니다. 다시 시도해주세요.",
} as const;

export function MenuAddSection({
  setUserMenus,
}: MenuAddSectionProps) {
  const { user } = useAuthContext();
  const [newListName, setNewListName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  // 단순한 낙관적 UI: userMenus 하나로만 관리

  // 시스템 장애인지 확인하는 함수
  const isSystemError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;

    const errorObj = error as { name?: string; status?: number; message?: string };

    // 네트워크 오류 또는 500번대 에러
    return errorObj.name === 'NetworkError' ||
           (errorObj.status && errorObj.status >= 500) ||
           errorObj.message?.includes('Network') || false;
  };

  // 그룹 저장
  const handleGroupSave = useCallback(async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName || !user) return;

    // 낙관적 업데이트: 임시 그룹 즉시 추가
    const tempId = generateTempId("group");
    const optimisticGroup = createOptimisticGroup(tempId, trimmedName);

    setUserMenus(prev => [...prev, { ...optimisticGroup, isPending: true }]);

    // UI 초기화 (서버 요청 시작 후)
    setNewGroupName("");
    setIsAddingGroup(false);

    try {
      const result = await createGroup(user.id, trimmedName);

      if (!result.success) throw new Error(result.error);

      // 성공: 낙관적 아이템의 pending 상태만 해제하고 실제 ID로 업데이트
      setUserMenus(prev =>
        prev.map(item =>
          item.id === tempId
            ? { ...item, isPending: false, id: (result.data as any).id }
            : item
        )
      );
    } catch (error) {
      // 실패: 임시 아이템 제거 (롤백)
      setUserMenus(prev => prev.filter(item => item.id !== tempId));

      // 시스템 장애만 토스트 표시
      if (isSystemError(error)) {
        toast.error(ERROR_MESSAGES.GROUP_CREATE);
      }
      menuLogger.error('Group creation failed', { error });
    }
  }, [newGroupName, user, setUserMenus]);

  // 그룹 취소
  const handleGroupCancel = useCallback(() => {
    setNewGroupName("");
    setIsAddingGroup(false);
  }, []);

  // 리스트 저장
  const handleListSave = useCallback(async () => {
    const trimmedName = newListName.trim();
    if (!trimmedName || !user) return;

    // 랜덤 색상 생성
    const randomColor = getRandomColor();

    // 낙관적 업데이트: 임시 리스트 즉시 추가
    const tempId = generateTempId("list");
    const optimisticList = createOptimisticList(tempId, trimmedName, randomColor);

    setUserMenus(prev => [...prev, { ...optimisticList, isPending: true }]);

    // UI 초기화 (서버 요청 시작 후)
    setNewListName("");

    try {
      const result = await createList(user.id, trimmedName, randomColor, null);

      if (!result.success) throw new Error(result.error);

      // 성공: 낙관적 아이템의 pending 상태만 해제하고 실제 ID로 업데이트
      setUserMenus(prev =>
        prev.map(item =>
          item.id === tempId
            ? { ...item, isPending: false, id: (result.data as any).id }
            : item
        )
      );
    } catch (error) {
      // 실패: 임시 아이템 제거 (롤백)
      setUserMenus(prev => prev.filter(item => item.id !== tempId));

      // 시스템 장애만 토스트 표시
      if (isSystemError(error)) {
        toast.error(ERROR_MESSAGES.LIST_CREATE);
      }
      menuLogger.error('List creation failed', { error });
    }
  }, [newListName, user, setUserMenus]);

  // 리스트 취소
  const handleListCancel = useCallback(() => {
    setNewListName("");
  }, []);

  // 그룹 토글
  const handleGroupToggle = useCallback(() => {
    setIsAddingGroup((prev) => !prev);
  }, []);

  return (
    <div>
      <div className="space-y-2 pt-2 pb-4">
        {/* 그룹 추가 입력 */}
        <GroupAddInput
          value={newGroupName}
          onChange={setNewGroupName}
          isVisible={isAddingGroup}
          onSave={handleGroupSave}
          onCancel={handleGroupCancel}
        />

        {/* 액션 버튼 영역 */}
        <div className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer">
          <ListAddInput
            value={newListName}
            onChange={setNewListName}
            onSave={handleListSave}
            onCancel={handleListCancel}
          />

          <SimpleTooltip text="새 그룹">
            <GroupAddToggleBtn onClick={handleGroupToggle} />
          </SimpleTooltip>
        </div>
      </div>
    </div>
  );
}
