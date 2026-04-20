import type { Ref } from "../../types";

export interface Obstacle {
  id: string;
  title: string;
  description: string;
  goal_refs: Ref[];
  belief_refs: Ref[];
  strategy: string;
}

export interface ObstaclesData {
  obstacles: Obstacle[];
  reflection: string;
}
