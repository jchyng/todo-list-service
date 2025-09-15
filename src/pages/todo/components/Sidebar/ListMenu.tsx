import ColorDot from "@/components/ColorDot";
import BaseMenu from "./BaseMenu";

interface ListMenuProps {
  dotSize: 1 | 2 | 3 | 4 | 5 | 6;
  dotColor: string;
  text: string;
  count: number;
}

export default function ListMenu({
  dotSize,
  dotColor,
  text,
  count,
}: ListMenuProps) {
  return (
    <BaseMenu
      icon={<ColorDot size={dotSize} color={dotColor} />}
      text={text}
      rightContent={<span className="text-muted-foreground">{count}</span>}
    />
  );
}
