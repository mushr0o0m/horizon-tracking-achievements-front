"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchOrganizerVerificationRequests,
  rejectAchievementRequest,
  verifyAchievementRequest,
} from "@/lib/backend-api";
import { useAchievementsStore } from "@/stores/achievements-store";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";

const loadedUsers = new Set<string>();

export function resetOrganizerVerificationRequestsCache() {
  loadedUsers.clear();
}

export function useOrganizerVerificationRequestsPage(userId: string, enabled = true) {
  const { achievements, setAchievements } = useAchievementsStore();
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchOrganizerVerificationRequests();
      setAchievements(data);
      loadedUsers.add(userId);
    } catch (error) {
      setAchievements([]);
      loadedUsers.add(userId);
    } finally {
      setIsLoading(false);
    }
  }, [setAchievements, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    if (achievements.length > 0) {
      loadedUsers.add(userId);
      return;
    }

    if (loadedUsers.has(userId)) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const data = await fetchOrganizerVerificationRequests();
        if (!cancelled) {
          setAchievements(data);
          loadedUsers.add(userId);
        }
      } catch (error) {
        if (!cancelled) {
          setAchievements([]);
          loadedUsers.add(userId);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [achievements.length, enabled, setAchievements, userId]);

  const handleReviewRequest = useCallback(
    async (
      achievementId: string,
      decision: "Подтверждено" | "Отклонено",
      comment?: string,
    ) => {
      try {
        if (decision === "Подтверждено") {
          await verifyAchievementRequest(achievementId, comment);
        } else {
          await rejectAchievementRequest(achievementId, comment);
        }
        await refresh();
        showSuccessToast(
          decision === "Подтверждено"
            ? "Достижение подтверждено"
            : "Запрос отклонен",
        );
      } catch (error) {
        showErrorToast(
          decision === "Подтверждено"
            ? "Не удалось подтвердить достижение."
            : "Не удалось отклонить запрос.",
        );
      }
    },
    [refresh],
  );

  return {
    requests: achievements,
    isLoading,
    handleReviewRequest,
    refresh,
  };
}
