import type { AchievementLevel } from "./types";

// Scoring weights for metrics
export const LEVEL_SCORES: Record<AchievementLevel, number> = {
  Международный: 5,
  Всероссийский: 3,
  Региональный: 1,
  Вузовский: 0,
  Факультетский: 0,
};

export const LEVEL_ORDER: Record<AchievementLevel, number> = {
  Международный: 5,
  Всероссийский: 4,
  Региональный: 3,
  Вузовский: 2,
  Факультетский: 1,
};

export const CHART_DATA = [
  { year: "2021", participations: 2 },
  { year: "2022", participations: 4 },
  { year: "2023", participations: 6 },
  { year: "2024", participations: 3 },
  { year: "2025", participations: 1 },
];
