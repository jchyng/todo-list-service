import { useState } from "react";
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

  // 낙관적 업데이트 훅 초기화
  const { execute: executeGroupCreate } = useOptimistic(createGroup, {
    onAdd: onGroupAdd,
    onRemove: onMenuRemove,
    onUpdate: onMenuUpdate,
  });

  const { execute: executeListCreate } = useOptimistic(createList, {
    onAdd: onListAdd,
    onRemove: onMenuRemove,
    onUpdate: onMenuUpdate,
  });

  const saveGroup = async () => {
    const trimmedName = newGroupName.trim();
    if (!trimmedName) return; // 빈 입력은 조용히 무시

    // UI 상태 즉시 업데이트
    setNewGroupName("");
    setIsAddingGroup(false);

    // 낙관적 업데이트 실행 (position은 DB에서 자동 계산)
    const tempId = generateTempId("group");
    const optimisticGroup = createOptimisticGroup(tempId, trimmedName);

    await executeGroupCreate(
      optimisticGroup,
      [user!.id, trimmedName], // afterPosition은 undefined (맨 뒤에 추가)
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

    // 낙관적 업데이트 실행 (position은 DB에서 자동 계산)
    const tempId = generateTempId("list");
    const optimisticList = createOptimisticList(tempId, trimmedName);

    await executeListCreate(
      optimisticList,
      [user!.id, trimmedName, null, null], // color, groupId, afterPosition은 기본값
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
