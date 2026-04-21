import type { Horizon, GoalStatus } from "./types";

export const HORIZON_LABEL: Record<Horizon, string> = {
  "30days": "30 Tage",
  quarter: "3 Monate",
  year: "1 Jahr",
  longer: "länger",
};

export const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Aktiv",
  achieved: "Erreicht",
  paused: "Pausiert",
};

export const GOAL_PROMPTS: string[] = [
  "Was genau willst du erreichen — so konkret, dass du es beschreiben könntest?",
  "Woran wirst du erkennen, dass du es erreicht hast?",
  "Warum ist dieses Ziel wichtig für dich — welchen Wert lebt es?",
  "Was könnte dich aufhalten? (Das ist Vorbereitung, keine Niederlage.)",
  "Was wäre dein allererster Schritt — heute oder diese Woche?",
];
