import type { ReactNode } from "react";

interface BaseMenuProps {
  icon: ReactNode;
  text: string;
  rightContent?: ReactNode;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

export default function BaseMenu({
  icon,
  text,
  rightContent,
  onClick,
  onContextMenu,
  className = "",
}: BaseMenuProps) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 hover:bg-accent cursor-pointer ${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-center gap-2">
        <div className="w-4 flex justify-center">{icon}</div>
        <span>{text}</span>
      </div>
      {rightContent && (
        <div className="w-4 flex justify-center">{rightContent}</div>
      )}
    </div>
  );
}
