"use client";

import { useEffect, useState } from "react";
import { fetchNotifications } from "@/lib/backend-api";
import { useNotificationsStore } from "@/stores/notifications-store";
import type { AppNotification } from "@/lib/types";

type StudentNotificationsRuntimeCache = {
  cachedNotificationsByUser: Map<string, AppNotification[]>;
  loadedByUser: Set<string>;
  pendingRequestsByUser: Map<string, Promise<AppNotification[]>>;
};

const STUDENT_NOTIFICATIONS_RUNTIME_CACHE_KEY =
  "__horizon_student_notifications_runtime_cache__";

function getStudentNotificationsRuntimeCache(): StudentNotificationsRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [STUDENT_NOTIFICATIONS_RUNTIME_CACHE_KEY]?: StudentNotificationsRuntimeCache;
  };

  if (!runtime[STUDENT_NOTIFICATIONS_RUNTIME_CACHE_KEY]) {
    runtime[STUDENT_NOTIFICATIONS_RUNTIME_CACHE_KEY] = {
      cachedNotificationsByUser: new Map<string, AppNotification[]>(),
      loadedByUser: new Set<string>(),
      pendingRequestsByUser: new Map<string, Promise<AppNotification[]>>(),
    };
  }

  return runtime[STUDENT_NOTIFICATIONS_RUNTIME_CACHE_KEY];
}

export function resetStudentNotificationsBootstrapCache() {
  const { cachedNotificationsByUser, loadedByUser, pendingRequestsByUser } =
    getStudentNotificationsRuntimeCache();
  cachedNotificationsByUser.clear();
  loadedByUser.clear();
  pendingRequestsByUser.clear();
}

export function useStudentNotificationsBootstrap(
  userId: string,
  enabled = true,
) {
  const { cachedNotificationsByUser, loadedByUser, pendingRequestsByUser } =
    getStudentNotificationsRuntimeCache();
  const { setNotifications } = useNotificationsStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !userId) return;

    let cancelled = false;
    const hasCached = loadedByUser.has(userId) && cachedNotificationsByUser.has(userId);

    const run = async () => {
      if (!hasCached) {
        setIsLoading(true);
      }
      try {
        let request = pendingRequestsByUser.get(userId);
        if (!request) {
          request = fetchNotifications(userId);
          pendingRequestsByUser.set(userId, request);
        }

        const data = await request;
        if (!cancelled) {
          cachedNotificationsByUser.set(userId, data);
          loadedByUser.add(userId);
          setNotifications(data);
        }
      } catch (error) {
        if (!cancelled) {
          if (!hasCached) {
            cachedNotificationsByUser.set(userId, []);
            loadedByUser.add(userId);
          }
        }
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
    setNotifications,
    cachedNotificationsByUser,
    loadedByUser,
    pendingRequestsByUser,
  ]);

  return {
    isLoading,
    loaded: loadedByUser.has(userId),
    cachedNotifications: cachedNotificationsByUser.get(userId) ?? null,
  };
}
