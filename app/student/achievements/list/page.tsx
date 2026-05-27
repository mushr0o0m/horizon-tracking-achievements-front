"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentAchievementsSection } from "@/app/student/achievements/list/section";
import type { Achievement, AppNotification, Event } from "@/lib/types";

interface StudentAchievementsPageContentProps {
  achievements: Achievement[];
  events: Event[];
  achievementNotifications: AppNotification[];
  visibleBadgeIds: string[];
  onOpenEvent: (eventId: string) => void;
  onOpenAchievement: (achievementId: string) => void;
  onCreateAchievement: () => void;
  onToggleBadgeVisibility: (badgeId: string) => void;
}

export function StudentAchievementsPageContent({
  achievements,
  events,
  achievementNotifications,
  visibleBadgeIds,
  onOpenEvent,
  onOpenAchievement,
  onCreateAchievement,
  onToggleBadgeVisibility,
}: StudentAchievementsPageContentProps) {
  return (
    <StudentAchievementsSection
      achievements={achievements}
      events={events}
      achievementNotifications={achievementNotifications}
      visibleBadgeIds={visibleBadgeIds}
      onOpenEvent={onOpenEvent}
      onOpenAchievement={onOpenAchievement}
      onCreateAchievement={onCreateAchievement}
      onToggleBadgeVisibility={onToggleBadgeVisibility}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
