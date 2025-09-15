import { useState } from "react";
import GroupAddInput from "./GroupAddInput";
import ListAddInput from "./ListAddInput";
import GroupAddToggleBtn from "./GroupAddTogglBtn";
import SimpleTooltip from "@/components/ui/SimpleTooltip";

export function MenuAddSection() {
  const [newListName, setNewListName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const saveGroup = () => {
    console.log("그룹 저장:", newGroupName);
    setNewGroupName("");
    setIsAddingGroup(false);
  };

  const cancelGroup = () => {
    setNewGroupName("");
    setIsAddingGroup(false);
  };

  const saveList = () => {
    console.log("리스트 저장:", newListName);
    setNewListName("");
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
