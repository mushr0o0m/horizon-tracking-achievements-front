"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveOrganizerEventApplication,
  fetchOrganizerEventApplications,
  rejectOrganizerEventApplication,
} from "@/lib/backend-api";
import type { EventApplication } from "@/lib/types";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";

type OrganizerEventApplicationsCache = {
  itemsByEventId: Map<string, EventApplication[]>;
  pendingByEventId: Map<string, Promise<EventApplication[]>>;
};

const ORGANIZER_EVENT_APPLICATIONS_CACHE_KEY =
  "__horizon_organizer_event_applications_cache__";

function getCache(): OrganizerEventApplicationsCache {
  const runtime = globalThis as typeof globalThis & {
    [ORGANIZER_EVENT_APPLICATIONS_CACHE_KEY]?: OrganizerEventApplicationsCache;
  };

  if (!runtime[ORGANIZER_EVENT_APPLICATIONS_CACHE_KEY]) {
    runtime[ORGANIZER_EVENT_APPLICATIONS_CACHE_KEY] = {
      itemsByEventId: new Map<string, EventApplication[]>(),
      pendingByEventId: new Map<string, Promise<EventApplication[]>>(),
    };
  }

  return runtime[ORGANIZER_EVENT_APPLICATIONS_CACHE_KEY];
}

export function resetOrganizerEventApplicationsCache() {
  const cache = getCache();
  cache.itemsByEventId.clear();
  cache.pendingByEventId.clear();
}

export function useOrganizerEventApplications(eventId?: string | null) {
  const cache = getCache();
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setApplications([]);
      return;
    }

    const cached = cache.itemsByEventId.get(eventId);
    if (cached) {
      setApplications(cached);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        let request = cache.pendingByEventId.get(eventId);
        if (!request) {
          request = fetchOrganizerEventApplications(eventId);
          cache.pendingByEventId.set(eventId, request);
        }

        const data = await request;
        if (!cancelled) {
          cache.itemsByEventId.set(eventId, data);
          setApplications(data);
        }
      } catch (error) {
        if (!cancelled) {
          setApplications([]);
        }
      } finally {
        cache.pendingByEventId.delete(eventId);
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [cache, eventId]);

  const refresh = useCallback(async () => {
    if (!eventId) return [];
    const data = await fetchOrganizerEventApplications(eventId);
    cache.itemsByEventId.set(eventId, data);
    setApplications(data);
    return data;
  }, [cache, eventId]);

  const approve = useCallback(
    async (applicationId: string, comment?: string) => {
      if (!eventId) return null;
      try {
        const updated = await approveOrganizerEventApplication(
          eventId,
          applicationId,
          comment,
        );
        const next = applications.map((item) =>
          item.id === applicationId ? updated : item,
        );
        cache.itemsByEventId.set(eventId, next);
        setApplications(next);
        showSuccessToast("Заявка подтверждена");
        return updated;
      } catch (error) {
        showErrorToast("Не удалось подтвердить заявку.");
        throw error;
      }
    },
    [applications, cache, eventId],
  );

  const reject = useCallback(
    async (applicationId: string, comment?: string) => {
      if (!eventId) return null;
      try {
        const updated = await rejectOrganizerEventApplication(
          eventId,
          applicationId,
          comment,
        );
        const next = applications.map((item) =>
          item.id === applicationId ? updated : item,
        );
        cache.itemsByEventId.set(eventId, next);
        setApplications(next);
        showSuccessToast("Заявка отклонена");
        return updated;
      } catch (error) {
        showErrorToast("Не удалось отклонить заявку.");
        throw error;
      }
    },
    [applications, cache, eventId],
  );

  return {
    applications,
    isLoading,
    refresh,
    approve,
    reject,
  };
}
