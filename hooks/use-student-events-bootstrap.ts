"use client";

import { useEffect, useState } from "react";
import { fetchPublicEvents } from "@/lib/backend-api";
import type { Event } from "@/lib/types";
import { useEventsStore } from "@/stores/events-store";

type StudentEventsRuntimeCache = {
  cachedEvents: Event[] | null;
  loaded: boolean;
  pendingRequest: Promise<Event[]> | null;
};

const STUDENT_EVENTS_RUNTIME_CACHE_KEY =
  "__horizon_student_events_runtime_cache__";

function getStudentEventsRuntimeCache(): StudentEventsRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [STUDENT_EVENTS_RUNTIME_CACHE_KEY]?: StudentEventsRuntimeCache;
  };

  if (!runtime[STUDENT_EVENTS_RUNTIME_CACHE_KEY]) {
    runtime[STUDENT_EVENTS_RUNTIME_CACHE_KEY] = {
      cachedEvents: null,
      loaded: false,
      pendingRequest: null,
    };
  }

  return runtime[STUDENT_EVENTS_RUNTIME_CACHE_KEY];
}

export function resetStudentEventsBootstrapCache() {
  const cache = getStudentEventsRuntimeCache();
  cache.cachedEvents = null;
  cache.loaded = false;
  cache.pendingRequest = null;
}

export function isStudentEventsBootstrapLoaded() {
  return getStudentEventsRuntimeCache().loaded;
}

export function useStudentEventsBootstrap(enabled = true) {
  const cache = getStudentEventsRuntimeCache();
  const { events, setEvents } = useEventsStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    if (events.length > 0) {
      cache.cachedEvents = events;
      cache.loaded = true;
      return;
    }

    if (cache.loaded && cache.cachedEvents) {
      setEvents(cache.cachedEvents);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        if (!cache.pendingRequest) {
          cache.pendingRequest = fetchPublicEvents();
        }
        const data = await cache.pendingRequest;
        if (!cancelled) {
          cache.cachedEvents = data;
          cache.loaded = true;
          setEvents(data);
        }
      } catch (error) {
        console.warn("Failed to bootstrap student events.", error);
      } finally {
        cache.pendingRequest = null;
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [cache, enabled, events, setEvents]);

  return {
    isLoading,
    loaded: cache.loaded,
    cachedEvents: cache.cachedEvents,
  };
}
