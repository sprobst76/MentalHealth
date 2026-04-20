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
