"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { EventDetailsPage } from "@/components/shared/event-details-page";
import type { ComponentProps } from "react";

interface HrEventDetailsViewPageProps {
  event?: ComponentProps<typeof EventDetailsPage>["event"];
  organizerInfo?: ComponentProps<typeof EventDetailsPage>["organizerInfo"];
  applications?: ComponentProps<typeof EventDetailsPage>["applications"];
  onBack?: () => void;
}

export function HrEventDetailsViewPageContent({
  event,
  organizerInfo,
  applications,
  onBack,
}: HrEventDetailsViewPageProps) {
  if (!event || !applications || !onBack) {
    return <AppShellCommon />;
  }

  return (
    <EventDetailsPage
      event={event}
      organizerInfo={organizerInfo}
      role="hr"
      applications={applications}
      onBack={onBack}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
