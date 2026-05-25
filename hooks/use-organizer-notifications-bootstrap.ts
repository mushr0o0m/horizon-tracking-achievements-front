"use client";

import { useEffect, useState } from "react";
import { fetchNotifications } from "@/lib/backend-api";
import { useNotificationsStore } from "@/stores/notifications-store";

const loadedUsers = new Set<string>();

export function resetOrganizerNotificationsBootstrapCache() {
  loadedUsers.clear();
}

export function useOrganizerNotificationsBootstrap(userId: string, enabled = true) {
  const { notifications, setNotifications } = useNotificationsStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !userId) return;

    if (notifications.some((item) => item.userId === userId)) {
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
        const data = await fetchNotifications(userId);
        if (!cancelled) {
          setNotifications(data);
          loadedUsers.add(userId);
        }
      } catch (error) {
        if (!cancelled) {
          setNotifications([]);
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
  }, [enabled, notifications, setNotifications, userId]);

  return {
    isLoading,
  };
}
