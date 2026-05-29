"use client";

import { StudentCreateAchievementSection } from "@/app/student/create-achievement/form/section";
import { AchievementRequestForm } from "@/components/student/achievement-request-form";
import type { ComponentProps } from "react";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";

interface StudentCreateAchievementPageContentProps {
  organizerOptions: ComponentProps<typeof AchievementRequestForm>["organizerOptions"];
  events: ComponentProps<typeof AchievementRequestForm>["events"];
  onBack: () => void;
  onSubmit: ComponentProps<typeof AchievementRequestForm>["onSubmit"];
}

export function StudentCreateAchievementPageContent({
  organizerOptions,
  events,
  onBack,
  onSubmit,
}: StudentCreateAchievementPageContentProps) {
  return (
    <StudentCreateAchievementSection
      organizerOptions={organizerOptions}
      events={events}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
}

export default function Page() {
  const runtime = useStudentPageRuntime();
  return (
    <StudentCreateAchievementPageContent
      organizerOptions={runtime.organizerOptions}
      events={runtime.events}
      onBack={runtime.backFromCreateAchievement}
      onSubmit={runtime.createStudentAchievementSubmit}
    />
  );
}
