import { Inbox } from "lucide-react";
import { useRef, useEffect } from "react";

interface GroupAddInputProps {
  value: string;
  onChange: (value: string) => void;
  isVisible: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function GroupAddInput({
  value,
  onChange,
  isVisible,
  onSave,
  onCancel,
}: GroupAddInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 transition-all duration-200 ${
        !isVisible && "hidden"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="w-4 flex justify-center">
          <Inbox className="h-4 w-4 text-gray-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="새 그룹 이름"
          className="outline-none"
        />
      </div>
    </div>
  );
}
