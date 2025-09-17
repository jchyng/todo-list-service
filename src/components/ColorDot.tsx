import { colorClasses, type TailwindColor } from "@/constant/TailwindColor";

interface ColorDotProps {
  color: TailwindColor;
  size?: 1 | 2 | 3 | 4 | 5 | 6;
}

// Tailwind CSS does not support dynamic class names directly
// reference: https://tailwindcss.com/docs/detecting-classes-in-source-files#dynamic-class-names
export default function ColorDot({ color, size = 2 }: ColorDotProps) {
  const sizeClasses = {
    1: "w-1 h-1",
    2: "w-2 h-2",
    3: "w-3 h-3",
    4: "w-4 h-4",
    5: "w-5 h-5",
    6: "w-6 h-6",
  };

  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];
  //https://inpa.tistory.com/entry/TS-%F0%9F%93%98-%ED%83%80%EC%9E%85%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8-keyof-typeof-%EC%82%AC%EC%9A%A9%EB%B2%95

  return <div className={`${sizeClass} ${colorClass} rounded-full`}></div>;
}
