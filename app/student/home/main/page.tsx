"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { Spinner } from "@/components/ui/spinner";
import { StudentHomeSection } from "@/app/student/home/main/section";
import { useStudentHomePage } from "@/hooks/use-student-home-page";
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
  return <AppShellCommon />;
}
