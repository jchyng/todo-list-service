import { Plus } from "lucide-react";
import { useRef } from "react";

interface ListAddInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ListAddInput({ value, onChange, onSave, onCancel }: ListAddInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 flex justify-center">
        <Plus className="h-4 w-4 text-gray-500" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="새 목록"
        className="outline-none placeholder:text-gray-500"
      />
    </div>
  );
}
