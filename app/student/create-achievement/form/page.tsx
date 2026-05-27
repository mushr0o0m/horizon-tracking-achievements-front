"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentCreateAchievementSection } from "@/app/student/create-achievement/form/section";
import { AchievementRequestForm } from "@/components/student/achievement-request-form";
import type { ComponentProps } from "react";

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
  return <AppShellCommon />;
}
