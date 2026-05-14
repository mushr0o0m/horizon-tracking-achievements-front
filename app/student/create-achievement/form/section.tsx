"use client";

import { AchievementRequestForm } from "@/components/student/achievement-request-form";
import type { ComponentProps } from "react";

interface StudentCreateAchievementSectionProps {
  organizerOptions: ComponentProps<typeof AchievementRequestForm>["organizerOptions"];
  events: ComponentProps<typeof AchievementRequestForm>["events"];
  onBack: () => void;
  onSubmit: ComponentProps<typeof AchievementRequestForm>["onSubmit"];
}

export function StudentCreateAchievementSection({
  organizerOptions,
  events,
  onBack,
  onSubmit,
}: StudentCreateAchievementSectionProps) {
  return (
    <AchievementRequestForm
      organizerOptions={organizerOptions}
      events={events}
      onBack={onBack}
      onSubmit={onSubmit}
    />
  );
}
