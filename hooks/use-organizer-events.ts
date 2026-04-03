import { useMemo } from "react";
import { Achievement, AuthUser, Event, UserRole } from "@/lib/types";

export function useOrganizerEvents(
  events: Event[],
  achievements: Achievement[],
  role: UserRole,
  currentUser: AuthUser | null,
) {
  const organizerVisibleEvents = useMemo(() => {
    if (role !== "organizer" || !currentUser) return events;

    const organizerEmails = new Set(
      [currentUser.email, currentUser.organizerProfile?.contactEmail]
        .filter((item): item is string => Boolean(item?.trim()))
        .map((item) => item.trim().toLowerCase()),
    );

    const ownEvents = events.filter(
      (event) =>
        event.organizerId === currentUser.id ||
        organizerEmails.has((event.contactEmail || "").trim().toLowerCase()),
    );

    const relatedEventIds = new Set(
      achievements
        .filter(
          (achievement) =>
            achievement.requestedOrganizerId === currentUser.id &&
            Boolean(achievement.eventId),
        )
        .map((achievement) => achievement.eventId as string),
    );

    const relatedEvents = events.filter((event) =>
      relatedEventIds.has(event.id),
    );

    const merged = [...ownEvents];
    relatedEvents.forEach((event) => {
      if (!merged.some((item) => item.id === event.id)) {
        merged.push(event);
      }
    });

    // Demo fallback: show seeded mocks for a newly registered organizer
    // until they create their own events.
    if (merged.length > 0) {
      return merged;
    }

    return events;
  }, [events, achievements, role, currentUser]);

  const organizerComputedStats = useMemo(
    () => ({
      eventsCount: organizerVisibleEvents.length,
      totalParticipants: organizerVisibleEvents.reduce(
        (sum, event) => sum + event.participantsCount,
        0,
      ),
    }),
    [organizerVisibleEvents],
  );

  return {
    organizerVisibleEvents,
    organizerComputedStats,
  };
}
