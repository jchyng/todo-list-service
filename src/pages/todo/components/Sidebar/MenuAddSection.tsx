import { useState } from "react";
import GroupAddInput from "./GroupAddInput";
import ListAddInput from "./ListAddInput";
import GroupAddToggleBtn from "./GroupAddTogglBtn";
import SimpleTooltip from "@/components/ui/SimpleTooltip";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOptimistic } from "@/hooks/useOptimistic";
import { createGroup, createList } from "@/services/todoMenuService";
import {
  generateTempId,
  generateNewPosition,
  createOptimisticGroup,
  createOptimisticList
} from "@/lib/todoMenuUtils";

import type { UserMenuProps } from "@/data/SidebarMenuData";

interface MenuAddSectionProps {
  onGroupAdd: (group: UserMenuProps) => void;
  onListAdd: (list: UserMenuProps) => void;
  onMenuRemove: (id: string) => void;
  onMenuUpdate: (item: UserMenuProps) => void;
  userMenus: UserMenuProps[];
}

export function MenuAddSection({ onGroupAdd, onListAdd, onMenuRemove, onMenuUpdate, userMenus }: MenuAddSectionProps) {
  const { user } = useAuthContext();
  const [newListName, setNewListName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  // 낙관적 업데이트 훅 초기화
  const { execute: executeGroupCreate } = useOptimistic(
    createGroup,
    { onAdd: onGroupAdd, onRemove: onMenuRemove, onUpdate: onMenuUpdate }
  );

  const { execute: executeListCreate } = useOptimistic(
    createList,
    { onAdd: onListAdd, onRemove: onMenuRemove, onUpdate: onMenuUpdate }
  );

  const saveGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return; // 빈 입력은 조용히 무시

    // UI 상태 즉시 업데이트
    setNewGroupName("");
    setIsAddingGroup(false);

    // 실제 데이터에서 마지막 position 가져오기
    const realMenus = userMenus.filter(menu => !menu.isTemp);
    const lastPosition = realMenus.length > 0
      ? realMenus[realMenus.length - 1].position || null
      : null;

    // 낙관적 업데이트 실행
    const tempId = generateTempId("group");
    const newPosition = generateNewPosition(lastPosition);
    const optimisticGroup = createOptimisticGroup(tempId, trimmedName);

    await executeGroupCreate(
      optimisticGroup,
      [user!.id, trimmedName, newPosition],
      "그룹 생성에 실패했습니다. 다시 시도해주세요."
    );
  };

  const cancelGroup = () => {
    setNewGroupName("");
    setIsAddingGroup(false);
  };

  const saveList = async () => {
    const trimmedName = newListName.trim();
    if (!trimmedName) return; // 빈 입력은 조용히 무시

    // UI 상태 즉시 업데이트
    setNewListName("");

    // 실제 데이터에서 마지막 position 가져오기
    const realMenus = userMenus.filter(menu => !menu.isTemp);
    const lastPosition = realMenus.length > 0
      ? realMenus[realMenus.length - 1].position || null
      : null;

    // 낙관적 업데이트 실행
    const tempId = generateTempId("list");
    const newPosition = generateNewPosition(lastPosition);
    const optimisticList = createOptimisticList(tempId, trimmedName);

    await executeListCreate(
      optimisticList,
      [user!.id, trimmedName, null, null, newPosition, false],
      "목록 생성에 실패했습니다. 다시 시도해주세요."
    );
  };

  const cancelList = () => {
    setNewListName("");
  };

  return (
    //todo: Command + N & Command + G => focus 처리
    <div>
      <div className="space-y-2 pt-2 pb-4">
        {/* Group Add Input */}
        <GroupAddInput
          value={newGroupName}
          onChange={setNewGroupName}
          isVisible={isAddingGroup}
          onSave={saveGroup}
          onCancel={cancelGroup}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer">
          <ListAddInput
            value={newListName}
            onChange={setNewListName}
            onSave={saveList}
            onCancel={cancelList}
          />
          <SimpleTooltip text="새 그룹">
            <GroupAddToggleBtn
              onClick={() => setIsAddingGroup(!isAddingGroup)}
            />
          </SimpleTooltip>
        </div>
      </div>
    </div>
  );
}
