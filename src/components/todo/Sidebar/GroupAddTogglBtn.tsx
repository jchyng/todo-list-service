import { Inbox } from "lucide-react";

interface GroupAddToggleBtnProps {
  onClick: () => void;
}

export default function GroupAddToggleBtn({ onClick }: GroupAddToggleBtnProps) {
  return (
    <div className="w-4 flex justify-center" onClick={onClick}>
      <Inbox className="h-4 w-4 text-gray-500" />
    </div>
  );
}
