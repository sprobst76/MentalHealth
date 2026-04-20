import type { ReactNode } from "react";

interface Props {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  tone?: "default" | "accent" | "sage" | "ocean";
}

const toneActive: Record<NonNullable<Props["tone"]>, string> = {
  default: "bg-ink text-paper border-ink",
  accent: "bg-accent text-paper border-accent",
  sage: "bg-sage text-paper border-sage",
  ocean: "bg-ocean text-paper border-ocean",
};

export function Chip({ active = false, onClick, children, tone = "default" }: Props) {
  const base =
    "inline-flex items-center px-3 py-1 rounded-full text-sm border transition-colors";
  const inactive = "bg-paper text-ink-soft border-line hover:border-ink-soft";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? toneActive[tone] : inactive}`}
    >
      {children}
    </button>
  );
}
