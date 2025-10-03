import { useEditableField } from "@/hooks/useEditableField";

interface EditableDescriptionProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
}

export function EditableDescription({ value, onSave, placeholder = "메모 추가" }: EditableDescriptionProps) {
  const {
    isEditing,
    editValue,
    inputRef,
    setEditValue,
    startEditing,
    handleSave
  } = useEditableField({ initialValue: value, onSave, multiline: true });

  if (isEditing) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        placeholder={placeholder}
        className="w-full h-full min-h-[200px] p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
      />
    );
  }

  return (
    <div
      onClick={startEditing}
      className="w-full h-full min-h-[200px] p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      {value ? (
        <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-gray-400 dark:text-gray-500">{placeholder}</p>
      )}
    </div>
  );
}
