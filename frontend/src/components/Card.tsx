import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}

export function Card({ children, className = "", as = "section" }: Props) {
  const Tag = as;
  return (
    <Tag
      className={`bg-paper-2 border border-line-soft rounded-sm p-6 ${className}`}
    >
      {children}
    </Tag>
  );
}
