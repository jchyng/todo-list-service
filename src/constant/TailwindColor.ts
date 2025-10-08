export const colors = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

export type TailwindColor = (typeof colors)[number];

// Tailwind JIT purge 문제 방지를 위해 정적 클래스 매핑
export const colorClasses: Record<TailwindColor, string> = {
  slate: "bg-slate-500",
  gray: "bg-gray-500",
  zinc: "bg-zinc-500",
  neutral: "bg-neutral-500",
  stone: "bg-stone-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-500",
  lime: "bg-lime-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
};

// 배경색 클래스 매핑 (연한 색상)
export const backgroundColorClasses: Record<TailwindColor, string> = {
  slate: "bg-slate-50",
  gray: "bg-gray-50",
  zinc: "bg-zinc-50",
  neutral: "bg-neutral-50",
  stone: "bg-stone-50",
  red: "bg-red-50",
  orange: "bg-orange-50",
  amber: "bg-amber-50",
  yellow: "bg-yellow-50",
  lime: "bg-lime-50",
  green: "bg-green-50",
  emerald: "bg-emerald-50",
  teal: "bg-teal-50",
  cyan: "bg-cyan-50",
  sky: "bg-sky-50",
  blue: "bg-blue-50",
  indigo: "bg-indigo-50",
  violet: "bg-violet-50",
  purple: "bg-purple-50",
  fuchsia: "bg-fuchsia-50",
  pink: "bg-pink-50",
  rose: "bg-rose-50",
};

// 랜덤 색상 선택 함수
export const getRandomColor = (): TailwindColor => {
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};
