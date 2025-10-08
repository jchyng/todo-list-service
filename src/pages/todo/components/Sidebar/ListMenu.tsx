import ColorDot from "@/components/ColorDot";
import BaseMenu from "./BaseMenu";
import { borderColorClasses, type TailwindColor } from "@/constant/TailwindColor";

interface ListMenuProps {
  dotSize: 1 | 2 | 3 | 4 | 5 | 6;
  dotColor: string;
  text: string;
  count: number;
  isPending?: boolean;
  isActive?: boolean;
}

export default function ListMenu({
  dotSize,
  dotColor,
  text,
  count,
  isPending = false,
  isActive = false,
}: ListMenuProps) {
  // dotColor에 맞는 border 클래스 가져오기
  const borderClass = borderColorClasses[dotColor as TailwindColor] || "border-gray-500";

  return (
    <BaseMenu
      icon={<ColorDot size={dotSize} color={dotColor} />}
      text={text}
      rightContent={<span className="text-muted-foreground">{count}</span>}
      className={`
        ${isPending ? "opacity-50 transition-opacity duration-200" : ""}
        ${isActive ? `bg-accent text-accent-foreground border-l-4 ${borderClass}` : ""}
      `.trim()}
    />
  );
}
