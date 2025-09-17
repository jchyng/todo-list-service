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

// Tailwind JIT purge 문제 방지를 위해 미리 맵 생성 (정적)
export const colorClasses: Record<TailwindColor, string> = {} as Record<
  TailwindColor,
  string
>;
colors.forEach((c) => {
  colorClasses[c] = `bg-${c}-500`;
});
