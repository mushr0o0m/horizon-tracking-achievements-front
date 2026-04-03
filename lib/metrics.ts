import { LEVEL_SCORES } from "@/lib/data";
import { Achievement, AchievementLevel } from "@/lib/types";

export interface StudentMetrics {
  achievementsCount: number;
  verifiedCount: number;
  activityIndex: number;
  highestLevel: AchievementLevel | "Нет";
  percentile: number;
  totalScore: number;
  levelDistribution: Array<{ name: AchievementLevel; value: number }>;
}

export function calculateStudentMetrics(achievements: Achievement[]): StudentMetrics {
  const verifiedAchievements = achievements.filter(
    (achievement) => achievement.status === "Подтверждено",
  );

  const achievementsCount = achievements.length;
  const verifiedCount = verifiedAchievements.length;
  
  // Индекс активности - взвешенная сумма баллов за мероприятия
  // Веса: международный = 5, всероссийский = 3, региональный = 1
  const activityIndex = verifiedAchievements.reduce(
    (sum, achievement) => sum + (LEVEL_SCORES[achievement.level] || 0),
    0,
  );

  const highestLevel: AchievementLevel | "Нет" =
    verifiedAchievements.length > 0
      ? verifiedAchievements.reduce((max, current) => {
          const maxScore = LEVEL_SCORES[max.level] || 0;
          const currentScore = LEVEL_SCORES[current.level] || 0;
          return currentScore > maxScore ? current : max;
        }).level
      : "Нет";

  const totalScore = verifiedAchievements.reduce(
    (sum, achievement) => sum + (LEVEL_SCORES[achievement.level] || 0),
    0,
  );

  const percentile = Math.min(Math.round((totalScore / 50) * 100), 100);

  const levelDistribution = (Object.keys(LEVEL_SCORES) as AchievementLevel[])
    .map((level) => ({
      name: level,
      value: verifiedAchievements.filter((achievement) => achievement.level === level)
        .length,
    }))
    .filter((item) => item.value > 0);

  return {
    achievementsCount,
    verifiedCount,
    activityIndex,
    highestLevel,
    percentile,
    totalScore,
    levelDistribution,
  };
}
