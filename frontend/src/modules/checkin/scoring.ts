export function sumAnswers(answers: number[]): number {
  return answers.reduce((acc, v) => acc + (v >= 0 ? v : 0), 0);
}

export function phq9Severity(score: number): {
  label: string;
  tone: "sage" | "ocean" | "accent" | "ink";
} {
  if (score <= 4) return { label: "minimal", tone: "sage" };
  if (score <= 9) return { label: "leicht", tone: "ocean" };
  if (score <= 14) return { label: "mittelgradig", tone: "accent" };
  if (score <= 19) return { label: "mittelschwer", tone: "accent" };
  return { label: "schwer", tone: "accent" };
}

export function gad7Severity(score: number): {
  label: string;
  tone: "sage" | "ocean" | "accent" | "ink";
} {
  if (score <= 4) return { label: "minimal", tone: "sage" };
  if (score <= 9) return { label: "leicht", tone: "ocean" };
  if (score <= 14) return { label: "mittel", tone: "accent" };
  return { label: "schwer", tone: "accent" };
}

export function isComplete(answers: number[], expectedLength: number): boolean {
  return answers.length === expectedLength && answers.every((v) => v >= 0);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}
