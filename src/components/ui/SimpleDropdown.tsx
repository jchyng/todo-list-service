import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface SimpleDropdownProps {
  children: ReactNode;
  triggerType: "click" | "contextmenu" | "both";
  menuItems: MenuItem[];
  className?: string;
}

export default function SimpleDropdown({
  children,
  triggerType,
  menuItems,
  className = "",
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTrigger = (e: React.MouseEvent) => {
    if (triggerType === "click" || triggerType === "both") {
      e.preventDefault();
      e.stopPropagation();

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setPosition({
          x: rect.left,
          y: rect.bottom + 4
        });
      }
      setIsOpen(true);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (triggerType === "contextmenu" || triggerType === "both") {
      e.preventDefault();
      e.stopPropagation();

      setPosition({
        x: e.clientX,
        y: e.clientY
      });
      setIsOpen(true);
    }
  };

  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    setIsOpen(false);
  };

  // 외부 클릭 및 ESC 키 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onClick={handleTrigger}
        onContextMenu={handleContextMenu}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 min-w-[8rem] bg-popover text-popover-foreground rounded-md border shadow-md p-1"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={cn(
                "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground",
                item.variant === "destructive" &&
                "text-destructive hover:bg-destructive/10 hover:text-destructive"
              )}
              onClick={() => handleMenuItemClick(item.onClick)}
            >
              {item.icon && (
                <span className="w-4 h-4 flex items-center justify-center">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}