import { useEditableField } from "@/hooks/useEditableField";
import { useEffect } from "react";

interface EditableDescriptionProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
}

export function EditableDescription({
  value,
  onSave,
  placeholder = "메모 추가",
}: EditableDescriptionProps) {
  const {
    isEditing,
    editValue,
    inputRef,
    setEditValue,
    startEditing,
    handleSave,
  } = useEditableField({ initialValue: value, onSave, multiline: true });

  // Auto-resize textarea based on content
  useEffect(() => {
    if (isEditing && inputRef.current) {
      const textarea = inputRef.current as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;
    }
  }, [isEditing, editValue, inputRef]);

  if (isEditing) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        placeholder={placeholder}
        className="w-full min-h-[120px] p-3 text-sm bg-white border border-gray-200 dark:border-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 overflow-y-auto"
        style={{
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          overflowX: 'hidden',
          maxHeight: '400px'
        }}
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      className="w-full min-h-[120px] max-h-[400px] p-3 text-sm bg-white border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors overflow-y-auto overflow-x-hidden"
    >
      {value ? (
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
          {value}
        </p>
      ) : (
        <p className="text-gray-400 dark:text-gray-500">{placeholder}</p>
      )}
    </div>
  );
}
