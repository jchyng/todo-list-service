import { useRef, useEffect } from "react";
import { colors, colorClasses, type TailwindColor } from "@/constant/TailwindColor";

interface ColorPickerProps {
  currentColor: string | null;
  onColorSelect: (color: TailwindColor) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function ColorPicker({ currentColor, onColorSelect, onClose, isOpen }: ColorPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleColorClick = (color: TailwindColor) => {
    onColorSelect(color);
    onClose();
  };

  return (
    <div
      ref={panelRef}
      className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      <div className="grid grid-cols-6 gap-2 w-48">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            className={`
              w-6 h-6 rounded-full ${colorClasses[color]}
              hover:scale-110 transition-transform
              ${currentColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}
            `}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}