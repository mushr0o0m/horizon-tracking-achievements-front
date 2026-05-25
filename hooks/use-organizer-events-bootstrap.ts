"use client";

import { useEffect, useState } from "react";
import { fetchOrganizerEvents } from "@/lib/backend-api";
import type { Event } from "@/lib/types";
import { useEventsStore } from "@/stores/events-store";

type OrganizerEventsRuntimeCache = {
  cachedEventsByUser: Map<string, Event[]>;
  pendingRequestsByUser: Map<string, Promise<Event[]>>;
};

const ORGANIZER_EVENTS_RUNTIME_CACHE_KEY =
  "__horizon_organizer_events_runtime_cache__";

function getOrganizerEventsRuntimeCache(): OrganizerEventsRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [ORGANIZER_EVENTS_RUNTIME_CACHE_KEY]?: OrganizerEventsRuntimeCache;
  };

  if (!runtime[ORGANIZER_EVENTS_RUNTIME_CACHE_KEY]) {
    runtime[ORGANIZER_EVENTS_RUNTIME_CACHE_KEY] = {
      cachedEventsByUser: new Map<string, Event[]>(),
      pendingRequestsByUser: new Map<string, Promise<Event[]>>(),
    };
  }

  return runtime[ORGANIZER_EVENTS_RUNTIME_CACHE_KEY];
}

export function resetOrganizerEventsBootstrapCache() {
  const { cachedEventsByUser, pendingRequestsByUser } =
    getOrganizerEventsRuntimeCache();
  cachedEventsByUser.clear();
  pendingRequestsByUser.clear();
}

export function useOrganizerEventsBootstrap(userId: string, enabled = true) {
  const { cachedEventsByUser, pendingRequestsByUser } =
    getOrganizerEventsRuntimeCache();
  const { events, setEvents } = useEventsStore();
  const [isLoading, setIsLoading] = useState(false);
  const cachedEvents = userId ? (cachedEventsByUser.get(userId) ?? null) : null;

  useEffect(() => {
    if (!enabled || !userId) return;

    if (events.length > 0) {
      cachedEventsByUser.set(userId, events);
      return;
    }

    if (cachedEventsByUser.has(userId)) {
      setEvents(cachedEventsByUser.get(userId) ?? []);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        let request = pendingRequestsByUser.get(userId);
        if (!request) {
          request = fetchOrganizerEvents();
          pendingRequestsByUser.set(userId, request);
        }

        const data = await request;
        if (!cancelled) {
          cachedEventsByUser.set(userId, data);
          setEvents(data);
        }
      } catch (error) {
        console.warn("Failed to bootstrap organizer events.", error);
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
  }, [enabled, events.length, setEvents, userId, cachedEventsByUser, pendingRequestsByUser]);

  return {
    isLoading,
    cachedEvents,
  };
}
