"use client";

import { useEffect, useState } from "react";
import { fetchStudentAchievements } from "@/lib/backend-api";
import type { Achievement } from "@/lib/types";
import { useAchievementsStore } from "@/stores/achievements-store";

type StudentAchievementsRuntimeCache = {
  cachedAchievementsByUser: Map<string, Achievement[]>;
  loadedByUser: Set<string>;
  pendingRequestsByUser: Map<string, Promise<Achievement[]>>;
};

const STUDENT_ACHIEVEMENTS_RUNTIME_CACHE_KEY =
  "__horizon_student_achievements_runtime_cache__";

function getStudentAchievementsRuntimeCache(): StudentAchievementsRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [STUDENT_ACHIEVEMENTS_RUNTIME_CACHE_KEY]?: StudentAchievementsRuntimeCache;
  };

  if (!runtime[STUDENT_ACHIEVEMENTS_RUNTIME_CACHE_KEY]) {
    runtime[STUDENT_ACHIEVEMENTS_RUNTIME_CACHE_KEY] = {
      cachedAchievementsByUser: new Map<string, Achievement[]>(),
      loadedByUser: new Set<string>(),
      pendingRequestsByUser: new Map<string, Promise<Achievement[]>>(),
    };
  }

  return runtime[STUDENT_ACHIEVEMENTS_RUNTIME_CACHE_KEY];
}

export function resetStudentAchievementsBootstrapCache() {
  const { cachedAchievementsByUser, loadedByUser, pendingRequestsByUser } =
    getStudentAchievementsRuntimeCache();
  cachedAchievementsByUser.clear();
  loadedByUser.clear();
  pendingRequestsByUser.clear();
}

export function useStudentAchievementsBootstrap(userId: string, enabled = true) {
  const { cachedAchievementsByUser, pendingRequestsByUser } =
    getStudentAchievementsRuntimeCache();
  const { loadedByUser } = getStudentAchievementsRuntimeCache();
  const { achievements, setAchievements } = useAchievementsStore();
  const [isLoading, setIsLoading] = useState(false);
  const cachedAchievements = userId
    ? (cachedAchievementsByUser.get(userId) ?? null)
    : null;

  useEffect(() => {
    if (!enabled || !userId) return;

    const userAchievements = achievements.filter(
      (item) => item.studentId === userId,
    );
    if (userAchievements.length > 0) {
      cachedAchievementsByUser.set(userId, achievements);
      loadedByUser.add(userId);
      return;
    }

    if (loadedByUser.has(userId) && cachedAchievementsByUser.has(userId)) {
      setAchievements(cachedAchievementsByUser.get(userId) ?? []);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        let request = pendingRequestsByUser.get(userId);
        if (!request) {
          request = fetchStudentAchievements(userId);
          pendingRequestsByUser.set(userId, request);
        }

        const data = await request;
        if (!cancelled) {
          cachedAchievementsByUser.set(userId, data);
          loadedByUser.add(userId);
          setAchievements(data);
        }
      } catch (error) {
        console.warn("Failed to bootstrap student achievements.", error);
      } finally {
        pendingRequestsByUser.delete(userId);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    userId,
    achievements,
    setAchievements,
    cachedAchievementsByUser,
    pendingRequestsByUser,
  ]);

  return {
    isLoading,
    loaded: loadedByUser.has(userId),
    cachedAchievements,
  };
}
