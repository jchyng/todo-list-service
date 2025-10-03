import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useEditableField } from "@/hooks/useEditableField";

interface EditableTitleProps {
  value: string;
  onSave: (value: string) => void;
  isCompleted?: boolean;
  placeholder?: string;
}

export function EditableTitle({ value, onSave, isCompleted, placeholder }: EditableTitleProps) {
  const {
    isEditing,
    editValue,
    inputRef,
    setEditValue,
    startEditing,
    handleSave,
    handleKeyDown
  } = useEditableField({ initialValue: value, onSave });

  if (isEditing) {
    return (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder={placeholder}
        className="text-base font-medium border-none p-0 h-auto shadow-none focus-visible:ring-0"
      />
    );
  }

  return (
    <h1
      onClick={startEditing}
      className={cn(
        "text-base font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors",
        isCompleted && "line-through text-gray-500 dark:text-gray-400"
      )}
    >
      {value}
    </h1>
  );
}
