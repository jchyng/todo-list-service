import * as React from "react";
import { cn } from "@/lib/utils";

interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  triggerClassName?: string;
}

export function Popover({
  children,
  content,
  open,
  onOpenChange,
  align = "center",
  side = "bottom",
  className,
  triggerClassName
}: PopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : isOpen;

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    // 세로 위치 계산
    if (side === "top") {
      top = triggerRect.top - contentRect.height - 8;
    } else if (side === "bottom") {
      top = triggerRect.bottom + 8;
    } else if (side === "left" || side === "right") {
      if (align === "start") {
        top = triggerRect.top;
      } else if (align === "end") {
        top = triggerRect.bottom - contentRect.height;
      } else {
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
      }
    }

    // 가로 위치 계산
    if (side === "left") {
      left = triggerRect.left - contentRect.width - 8;
    } else if (side === "right") {
      left = triggerRect.right + 8;
    } else if (side === "top" || side === "bottom") {
      if (align === "start") {
        left = triggerRect.left;
      } else if (align === "end") {
        left = triggerRect.right - contentRect.width;
      } else {
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
      }
    }

    // 화면 경계 내에 위치하도록 조정
    left = Math.max(8, Math.min(left, viewportWidth - contentRect.width - 8));
    top = Math.max(8, Math.min(top, viewportHeight - contentRect.height - 8));

    setPosition({ top, left });
  }, [side, align]);

  React.useEffect(() => {
    if (actualOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [actualOpen, updatePosition]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        actualOpen &&
        contentRef.current &&
        triggerRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        const newOpen = false;
        if (isControlled) {
          onOpenChange?.(newOpen);
        } else {
          setIsOpen(newOpen);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [actualOpen, isControlled, onOpenChange]);

  const handleTriggerClick = () => {
    const newOpen = !actualOpen;
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleTriggerClick}
        className={cn("inline-block cursor-pointer", triggerClassName)}
      >
        {children}
      </div>

      {actualOpen && (
        <>
          {/* 백드롭 */}
          <div className="fixed inset-0 z-40" />

          {/* 팝오버 콘텐츠 */}
          <div
            ref={contentRef}
            className={cn(
              "fixed z-50 rounded-lg border border-gray-200 dark:border-gray-700",
              "bg-white dark:bg-gray-900 shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              className
            )}
            style={{
              top: position.top,
              left: position.left,
            }}
          >
            {content}
          </div>
        </>
      )}
    </>
  );
}