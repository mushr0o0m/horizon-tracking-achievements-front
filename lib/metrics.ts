import { LEVEL_ORDER, LEVEL_SCORES } from "@/lib/data";
import { Achievement, AchievementLevel } from "@/lib/types";

interface AchievementResultMeta {
  rank: number;
  label: string;
}

export interface StudentMetrics {
  achievementsCount: number;
  activityIndex: number;
  highestLevel: AchievementLevel | "Нет";
  highestAchievementLabel: string;
  totalScore: number;
  participationDynamics: Array<{ year: string; participations: number }>;
  levelDistribution: Array<{ name: AchievementLevel; value: number }>;
}

const LEVEL_GENITIVE: Record<AchievementLevel, string> = {
  Международный: "международной",
  Всероссийский: "всероссийской",
  Региональный: "региональной",
  Вузовский: "вузовской",
  Факультетский: "факультетской",
};

function resolveResultMeta(result: string): AchievementResultMeta {
  const normalized = result.trim().toLowerCase();
  if (
    normalized.includes("побед") ||
    /^1\s*мест/.test(normalized) ||
    normalized.includes("winner")
  ) {
    return { rank: 4, label: "Победитель" };
  }
  if (
    normalized.includes("приз") ||
    /^2\s*мест/.test(normalized) ||
    /^3\s*мест/.test(normalized) ||
    normalized.includes("prize")
  ) {
    return { rank: 3, label: "Призер" };
  }
  if (normalized.includes("участ") || normalized.includes("participant")) {
    return { rank: 2, label: "Участник" };
  }
  if (normalized.includes("опублик") || normalized.includes("publish")) {
    return { rank: 1, label: "Публикация" };
  }
  if (result.trim()) {
    return { rank: 0, label: result.trim() };
  }
  return { rank: 0, label: "Участник" };
}

function buildHighestAchievementLabel(achievement: Achievement | null): string {
  if (!achievement) return "Нет";
  const resultMeta = resolveResultMeta(achievement.result);
  return `${resultMeta.label} ${LEVEL_GENITIVE[achievement.level]}`;
}

function buildParticipationDynamics(
  achievements: Achievement[],
): Array<{ year: string; participations: number }> {
  const byYear = new Map<number, number>();
  achievements.forEach((achievement) => {
    const date = new Date(`${achievement.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    const year = date.getFullYear();
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
  });

  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, participations]) => ({
      year: String(year),
      participations,
    }));
}

export function calculateStudentMetrics(
  achievements: Achievement[],
): StudentMetrics {
  const achievementsCount = achievements.length;

  // Индекс активности - взвешенная сумма баллов за все достижения
  const activityIndex = achievements.reduce(
    (sum, achievement) => sum + (LEVEL_SCORES[achievement.level] || 0),
    0,
  );

  const topAchievement =
    achievements.length > 0
      ? achievements.reduce((best, current) => {
          const bestLevelRank = LEVEL_ORDER[best.level] || 0;
          const currentLevelRank = LEVEL_ORDER[current.level] || 0;
          if (currentLevelRank !== bestLevelRank) {
            return currentLevelRank > bestLevelRank ? current : best;
          }

          const bestResultRank = resolveResultMeta(best.result).rank;
          const currentResultRank = resolveResultMeta(current.result).rank;
          if (currentResultRank !== bestResultRank) {
            return currentResultRank > bestResultRank ? current : best;
          }

          return new Date(current.date).getTime() > new Date(best.date).getTime()
            ? current
            : best;
        })
      : null;

  const highestLevel: AchievementLevel | "Нет" =
    topAchievement?.level ?? "Нет";
  const highestAchievementLabel = buildHighestAchievementLabel(topAchievement);

  const totalScore = achievements.reduce(
    (sum, achievement) => sum + (LEVEL_SCORES[achievement.level] || 0),
    0,
  );

  const levelDistribution = (Object.keys(LEVEL_SCORES) as AchievementLevel[])
    .map((level) => ({
      name: level,
      value: achievements.filter(
        (achievement) => achievement.level === level,
      ).length,
    }))
    .filter((item) => item.value > 0);
  const participationDynamics = buildParticipationDynamics(achievements);

  return {
    achievementsCount,
    activityIndex,
    highestLevel,
    highestAchievementLabel,
    totalScore,
    participationDynamics,
    levelDistribution,
  };
}
