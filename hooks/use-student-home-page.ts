"use client";

import { useMemo } from "react";
import type { AuthUser, Event, Achievement } from "@/lib/types";
import { useStudentEventsBootstrap } from "@/hooks/use-student-events-bootstrap";
import { useStudentAchievementsBootstrap } from "@/hooks/use-student-achievements-bootstrap";
import { useStudentSubscribersBootstrap } from "@/hooks/use-student-subscribers-bootstrap";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

export function useStudentHomePage(currentUser: AuthUser, enabled = true) {
  const eventsBootstrap = useStudentEventsBootstrap(enabled);
  const achievementsBootstrap = useStudentAchievementsBootstrap(
    currentUser.id,
    enabled,
  );
  const subscribersBootstrap = useStudentSubscribersBootstrap(
    currentUser.id,
    enabled,
  );

  const events = eventsBootstrap.cachedEvents ?? [];
  const achievements = achievementsBootstrap.cachedAchievements ?? [];
  const subscribers = subscribersBootstrap.subscribers;

  const studentAchievements = useMemo(
    () => achievements.filter((item) => item.studentId === currentUser.id),
    [achievements, currentUser.id],
  );

  const studentEventIds = useMemo(
    () =>
      new Set(
        studentAchievements
          .map((achievement) => achievement.eventId)
          .filter((eventId): eventId is string => Boolean(eventId)),
      ),
    [studentAchievements],
  );

  const availableStudentEvents = useMemo(
    () =>
      events
        .filter((event) => event.status === "published")
        .filter((event) => !studentEventIds.has(event.id)),
    [events, studentEventIds],
  );

  const recommendedStudentEvents = useMemo(
    () =>
      [...availableStudentEvents].sort(
        (a, b) =>
          new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime(),
      ),
    [availableStudentEvents],
  );

  const homeLoading =
    !eventsBootstrap.loaded ||
    !achievementsBootstrap.loaded ||
    !subscribersBootstrap.loaded;

  return {
    achievements: studentAchievements,
    recommendedEvents: recommendedStudentEvents,
    subscribers,
    isLoading: homeLoading,
    isEventsLoading: eventsBootstrap.isLoading,
    isAchievementsLoading: achievementsBootstrap.isLoading,
    isSubscribersLoading: subscribersBootstrap.isLoading,
  };
}
