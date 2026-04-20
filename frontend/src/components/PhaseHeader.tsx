import type { ReactNode } from "react";

interface Props {
  phaseNum: string;
  title: string;
  subtitle?: ReactNode;
}

export function PhaseHeader({ phaseNum, title, subtitle }: Props) {
  return (
    <header className="border-b border-line-soft pb-6 mb-8">
      <div className="text-ink-faint text-xs tracking-[0.2em] uppercase">
        Phase {phaseNum}
      </div>
      <h1 className="display text-4xl mt-2 text-ink">{title}</h1>
      {subtitle ? (
        <p className="text-ink-soft mt-3 max-w-2xl leading-relaxed">{subtitle}</p>
      ) : null}
    </header>
  );
}
