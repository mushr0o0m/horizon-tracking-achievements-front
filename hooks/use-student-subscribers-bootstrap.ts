"use client";

import { useEffect, useState } from "react";
import { fetchStudentSubscribers } from "@/lib/backend-api";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

type StudentSubscribersRuntimeCache = {
  cachedSubscribersByUser: Map<string, SubscriberPreviewItem[]>;
  loadedByUser: Set<string>;
  pendingRequestsByUser: Map<string, Promise<SubscriberPreviewItem[]>>;
};

const STUDENT_SUBSCRIBERS_RUNTIME_CACHE_KEY =
  "__horizon_student_subscribers_runtime_cache__";

function getStudentSubscribersRuntimeCache(): StudentSubscribersRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [STUDENT_SUBSCRIBERS_RUNTIME_CACHE_KEY]?: StudentSubscribersRuntimeCache;
  };

  if (!runtime[STUDENT_SUBSCRIBERS_RUNTIME_CACHE_KEY]) {
    runtime[STUDENT_SUBSCRIBERS_RUNTIME_CACHE_KEY] = {
      cachedSubscribersByUser: new Map<string, SubscriberPreviewItem[]>(),
      loadedByUser: new Set<string>(),
      pendingRequestsByUser: new Map<string, Promise<SubscriberPreviewItem[]>>(),
    };
  }

  return runtime[STUDENT_SUBSCRIBERS_RUNTIME_CACHE_KEY];
}

export function resetStudentSubscribersBootstrapCache() {
  const { cachedSubscribersByUser, loadedByUser, pendingRequestsByUser } =
    getStudentSubscribersRuntimeCache();
  cachedSubscribersByUser.clear();
  loadedByUser.clear();
  pendingRequestsByUser.clear();
}

function normalizeSubscribers(): Promise<SubscriberPreviewItem[]> {
  return fetchStudentSubscribers().then((subscribersData) =>
    subscribersData.reduce<SubscriberPreviewItem[]>((acc, item) => {
      const firstName = item.firstName ?? "";
      const lastName = item.lastName ?? "";
      const name =
        item.fullName?.trim() ||
        item.name?.trim() ||
        [lastName, firstName].filter(Boolean).join(" ").trim() ||
        item.companyName ||
        item.email ||
        "HR";
      const id = item.hrId ?? item.id ?? item.email ?? "";
      if (!id) return acc;
      acc.push({
        id,
        name,
        companyName: item.companyName ?? "",
        email: item.email ?? "",
      });
      return acc;
    }, []),
  );
}

export function useStudentSubscribersBootstrap(userId: string, enabled = true) {
  const { cachedSubscribersByUser, loadedByUser, pendingRequestsByUser } =
    getStudentSubscribersRuntimeCache();
  const [isLoading, setIsLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<SubscriberPreviewItem[]>([]);

  useEffect(() => {
    if (!enabled || !userId) return;

    if (loadedByUser.has(userId) && cachedSubscribersByUser.has(userId)) {
      setSubscribers(cachedSubscribersByUser.get(userId) ?? []);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        let request = pendingRequestsByUser.get(userId);
        if (!request) {
          request = normalizeSubscribers();
          pendingRequestsByUser.set(userId, request);
        }
        const data = await request;
        if (!cancelled) {
          cachedSubscribersByUser.set(userId, data);
          loadedByUser.add(userId);
          setSubscribers(data);
        }
      } catch (error) {
        if (!cancelled) {
          cachedSubscribersByUser.set(userId, []);
          loadedByUser.add(userId);
          setSubscribers([]);
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
  }, [enabled, userId, cachedSubscribersByUser, loadedByUser, pendingRequestsByUser]);

  return {
    isLoading,
    loaded: loadedByUser.has(userId),
    cachedSubscribers: cachedSubscribersByUser.get(userId) ?? null,
    subscribers,
  };
}
