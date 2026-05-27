"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentEventDetailsSection } from "@/app/student/event-details/view/section";
import { type ComponentProps } from "react";

interface StudentEventDetailsPageContentProps {
  event: ComponentProps<typeof StudentEventDetailsSection>["event"];
  organizerInfo: ComponentProps<typeof StudentEventDetailsSection>["organizerInfo"];
  applications: ComponentProps<typeof StudentEventDetailsSection>["applications"];
  isApplied: boolean;
  onToggleApplication: () => void;
  onBack: () => void;
}

export function StudentEventDetailsPageContent({
  event,
  organizerInfo,
  applications,
  isApplied,
  onToggleApplication,
  onBack,
}: StudentEventDetailsPageContentProps) {
  return (
    <StudentEventDetailsSection
      event={event}
      organizerInfo={organizerInfo}
      applications={applications}
      isApplied={isApplied}
      onToggleApplication={onToggleApplication}
      onBack={onBack}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
