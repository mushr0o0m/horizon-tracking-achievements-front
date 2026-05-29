"use client";

import { StudentEventDetailsSection } from "@/app/student/event-details/view/section";
import { type ComponentProps } from "react";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";

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
  const runtime = useStudentPageRuntime();

  if (!runtime.displayedEvent) {
    return null;
  }

  return (
    <StudentEventDetailsPageContent
      event={runtime.displayedEvent}
      organizerInfo={runtime.eventOrganizerInfo}
      applications={runtime.selectedEventApplications}
      isApplied={runtime.isCurrentStudentApplied}
      onToggleApplication={() => runtime.toggleApplication(runtime.displayedEvent!.id)}
      onBack={runtime.backFromEvent}
    />
  );
}
