import { useState, useEffect, useRef } from "react";

interface UseEditableFieldOptions {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel?: () => void;
  multiline?: boolean;
}

/**
 * 편집 가능한 필드의 상태 및 동작 관리 Hook
 */
export function useEditableField({
  initialValue,
  onSave,
  onCancel,
  multiline = false
}: UseEditableFieldOptions) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // 초기값 변경 시 동기화
  useEffect(() => {
    setEditValue(initialValue);
  }, [initialValue]);

  // 편집 모드 시작 시 포커스
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const startEditing = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue !== initialValue) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(initialValue);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  return {
    isEditing,
    editValue,
    inputRef,
    setEditValue,
    startEditing,
    handleSave,
    handleCancel,
    handleKeyDown
  };
}
