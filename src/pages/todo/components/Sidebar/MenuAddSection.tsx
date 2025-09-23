import { useState, useCallback } from "react";
import GroupAddInput from "./GroupAddInput";
import ListAddInput from "./ListAddInput";
import GroupAddToggleBtn from "./GroupAddTogglBtn";
import SimpleTooltip from "@/components/ui/SimpleTooltip";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOptimistic } from "@/hooks/useOptimistic";
import { createGroup, createList } from "@/services/todoMenuService";
import {
  generateTempId,
  createOptimisticGroup,
  createOptimisticList,
} from "@/lib/todoMenuUtils";

import type { UserMenuProps } from "@/data/SidebarMenuData";

interface MenuAddSectionProps {
  onGroupAdd: (group: UserMenuProps) => void;
  onListAdd: (list: UserMenuProps) => void;
  onMenuRemove: (id: string) => void;
  onMenuUpdate: (item: UserMenuProps) => void;
}

// 에러 메시지 상수
const ERROR_MESSAGES = {
  GROUP_CREATE: "그룹 생성에 실패했습니다. 다시 시도해주세요.",
  LIST_CREATE: "목록 생성에 실패했습니다. 다시 시도해주세요.",
} as const;

export function MenuAddSection({
  onGroupAdd,
  onListAdd,
  onMenuRemove,
  onMenuUpdate,
}: MenuAddSectionProps) {
  const { user } = useAuthContext();
  const [newListName, setNewListName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  // 낙관적 업데이트 훅
  const groupOptimistic = useOptimistic(createGroup, {
    onAdd: onGroupAdd,
    onRemove: onMenuRemove,
    onUpdate: onMenuUpdate,
  });

  const listOptimistic = useOptimistic(createList, {
    onAdd: onListAdd,
    onRemove: onMenuRemove,
    onUpdate: onMenuUpdate,
  });

  // 그룹 저장
  const handleGroupSave = useCallback(async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName || !user) return;

    // UI 초기화
    setNewGroupName("");
    setIsAddingGroup(false);

    // 낙관적 업데이트 실행
    const tempId = generateTempId("group");
    const optimisticGroup = createOptimisticGroup(tempId, trimmedName);

    await groupOptimistic.execute(
      optimisticGroup,
      [user.id, trimmedName],
      ERROR_MESSAGES.GROUP_CREATE
    );
  }, [newGroupName, user, groupOptimistic]);

  // 그룹 취소
  const handleGroupCancel = useCallback(() => {
    setNewGroupName("");
    setIsAddingGroup(false);
  }, []);

  // 리스트 저장
  const handleListSave = useCallback(async () => {
    const trimmedName = newListName.trim();
    if (!trimmedName || !user) return;

    // UI 초기화
    setNewListName("");

    // 낙관적 업데이트 실행
    const tempId = generateTempId("list");
    const optimisticList = createOptimisticList(tempId, trimmedName);

    await listOptimistic.execute(
      optimisticList,
      [user.id, trimmedName, null, null],
      ERROR_MESSAGES.LIST_CREATE
    );
  }, [newListName, user, listOptimistic]);

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
