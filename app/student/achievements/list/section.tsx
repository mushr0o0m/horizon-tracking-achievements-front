"use client";

import { AchievementsPage } from "@/components/student/achievements-page";
import type { Achievement, AppNotification, Event } from "@/lib/types";
import type { StudentAchievementsTab } from "@/components/student/achievements-page";

interface StudentAchievementsSectionProps {
  achievements: Achievement[];
  events: Event[];
  achievementNotifications: AppNotification[];
  visibleBadgeIds: string[];
  onOpenEvent: (eventId: string) => void;
  onOpenAchievement: (achievementId: string) => void;
  onCreateAchievement: () => void;
  onToggleBadgeVisibility: (badgeId: string) => void;
  activeTab: StudentAchievementsTab;
  onTabChange: (tab: StudentAchievementsTab) => void;
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
  activeTab,
  onTabChange,
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
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}
