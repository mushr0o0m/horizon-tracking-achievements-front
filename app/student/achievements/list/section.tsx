"use client";

import { AchievementsPage } from "@/components/student/achievements-page";
import type { Achievement, AppNotification, Event } from "@/lib/types";

interface StudentAchievementsSectionProps {
  achievements: Achievement[];
  events: Event[];
  achievementNotifications: AppNotification[];
  visibleBadgeIds: string[];
  onOpenEvent: (eventId: string) => void;
  onOpenAchievement: (achievementId: string) => void;
  onCreateAchievement: () => void;
  onToggleBadgeVisibility: (badgeId: string) => void;
}

export function StudentAchievementsSection({
  achievements,
  events,
  achievementNotifications,
  visibleBadgeIds,
  onOpenEvent,
  onOpenAchievement,
  onCreateAchievement,
  onToggleBadgeVisibility,
}: StudentAchievementsSectionProps) {
  return (
    <AchievementsPage
      achievements={achievements}
      events={events}
      onOpenEvent={onOpenEvent}
      onOpenAchievement={onOpenAchievement}
      onCreateAchievement={onCreateAchievement}
      achievementNotifications={achievementNotifications}
      visibleBadgeIds={visibleBadgeIds}
      onToggleBadgeVisibility={onToggleBadgeVisibility}
    />
  );
}
