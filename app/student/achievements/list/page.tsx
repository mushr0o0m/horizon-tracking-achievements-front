"use client";

import { StudentAchievementsSection } from "@/app/student/achievements/list/section";
import type { Achievement, AppNotification, Event } from "@/lib/types";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";
import { StudentAchievementModal } from "@/app/_components/student/use-student-page-runtime";
import { STUDENT_ROUTES } from "@/app/shared/routing/app-shell-routes";
import type { StudentAchievementsTab } from "@/components/student/achievements-page";

interface StudentAchievementsPageContentProps {
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

export function StudentAchievementsPageContent({
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
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}

export default function Page() {
  const runtime = useStudentPageRuntime();

  return (
    <>
      <StudentAchievementsPageContent
        achievements={runtime.studentAchievements}
        events={runtime.events}
        achievementNotifications={runtime.studentAchievementNotifications}
        visibleBadgeIds={runtime.visibleBadgeIds}
        onOpenEvent={runtime.openEventFromCurrent}
        onOpenAchievement={runtime.openAchievement}
        onCreateAchievement={runtime.openCreateAchievement}
        onToggleBadgeVisibility={runtime.toggleBadgeVisibility}
        activeTab={runtime.studentAchievementsTab}
        onTabChange={runtime.onAchievementsTabChange}
      />
      <StudentAchievementModal
        achievement={runtime.selectedAchievement}
        event={runtime.selectedAchievementEvent}
        isEventLoading={runtime.isSelectedAchievementEventLoading}
        isVisibleInPublic={
          runtime.selectedAchievement
            ? runtime.currentUser.publicProfile.visibleAchievementIds.includes(
                runtime.selectedAchievement.id,
              )
            : false
        }
        onToggleVisible={(nextValue) => {
          if (!runtime.selectedAchievement) return;
          runtime.toggleAchievementVisibility(
            runtime.selectedAchievement.id,
            nextValue,
          );
        }}
        onClose={runtime.closeAchievement}
        onOpenEvent={(eventId) => {
          runtime.openEventFromCurrent(eventId);
          runtime.closeAchievement();
        }}
      />
    </>
  );
}
