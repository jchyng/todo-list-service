import ColorDot from "@/components/ColorDot";
import BaseMenu from "./BaseMenu";

interface ListMenuProps {
  dotSize: 1 | 2 | 3 | 4 | 5 | 6;
  dotColor: string;
  text: string;
  count: number;
  isPending?: boolean;
}

export default function ListMenu({
  dotSize,
  dotColor,
  text,
  count,
  isPending = false,
}: ListMenuProps) {
  return (
    <BaseMenu
      icon={<ColorDot size={dotSize} color={dotColor} />}
      text={text}
      rightContent={<span className="text-muted-foreground">{count}</span>}
      className={isPending ? "opacity-50 transition-opacity duration-200" : ""}
    />
  );
}
