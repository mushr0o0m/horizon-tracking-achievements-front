"use client";

import { EventDetailsPage } from "@/components/shared/event-details-page";
import type { ComponentProps } from "react";

interface StudentEventDetailsSectionProps {
  event: ComponentProps<typeof EventDetailsPage>["event"];
  organizerInfo: ComponentProps<typeof EventDetailsPage>["organizerInfo"];
  applications: ComponentProps<typeof EventDetailsPage>["applications"];
  isApplied: boolean;
  onToggleApplication: () => void;
  onBack: () => void;
}

export function StudentEventDetailsSection({
  event,
  organizerInfo,
  applications,
  isApplied,
  onToggleApplication,
  onBack,
}: StudentEventDetailsSectionProps) {
  return (
    <EventDetailsPage
      event={event}
      organizerInfo={organizerInfo}
      role="student"
      applications={applications}
      isApplied={isApplied}
      onToggleApplication={onToggleApplication}
      onBack={onBack}
    />
  );
}
