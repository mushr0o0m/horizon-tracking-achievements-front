"use client";

import { StudentHomeSection } from "@/app/student/home/main/section";
import { Spinner } from "@/components/ui/spinner";
import { useStudentHomePage } from "@/hooks/use-student-home-page";
import {
  StudentAchievementModal,
  useStudentPageRuntime,
} from "@/app/_components/student/use-student-page-runtime";
import type { AuthUser } from "@/lib/types";

interface StudentHomePageContentProps {
  currentUser: AuthUser;
  onOpenEvent: (eventId: string) => void;
  onOpenAchievement: (achievementId: string) => void;
  onOpenSubscribers: () => void;
  onOpenRecommendedEvents: () => void;
}

export function StudentHomePageContent({
  currentUser,
  onOpenEvent,
  onOpenAchievement,
  onOpenSubscribers,
  onOpenRecommendedEvents,
}: StudentHomePageContentProps) {
  const { achievements, recommendedEvents, subscribers, isLoading } =
    useStudentHomePage(currentUser, true);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <StudentHomeSection
      achievements={achievements}
      recommendedEvents={recommendedEvents}
      user={currentUser}
      subscribers={subscribers}
      onOpenSubscribers={onOpenSubscribers}
      onOpenEvent={onOpenEvent}
      onOpenAchievement={onOpenAchievement}
      onOpenRecommendedEvents={onOpenRecommendedEvents}
    />
  );
}

export default function Page() {
  const runtime = useStudentPageRuntime();

  return (
    <>
      <StudentHomePageContent
        currentUser={runtime.currentUser}
        onOpenEvent={runtime.openEventFromCurrent}
        onOpenAchievement={runtime.openAchievement}
        onOpenSubscribers={runtime.openSubscribersFromHome}
        onOpenRecommendedEvents={runtime.openRecommendedEvents}
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
