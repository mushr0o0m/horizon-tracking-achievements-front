"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { EventDetailsPage } from "@/components/shared/event-details-page";
import { useOrganizerEventDetailsPage } from "@/hooks/use-organizer-event-details-page";
import { useOrganizerEventApplications } from "@/hooks/use-organizer-event-applications";
import { useOrganizerEventsPage } from "@/hooks/use-organizer-events-page";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import type { Event, OrganizerView } from "@/lib/types";

interface OrganizerEventDetailsPageProps {
  event?: Event | null;
  eventId?: string | null;
  setOrganizerView?: (view: OrganizerView) => void;
  setSelectedEventId?: (id: string | null) => void;
}

export function OrganizerEventDetailsPageContent({
  event,
  eventId,
  setOrganizerView,
  setSelectedEventId,
}: OrganizerEventDetailsPageProps) {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const resolvedEventId = eventId ?? params?.eventId ?? null;
  const resolvedEvent = event ?? null;
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const { handleDeleteEvent } = useOrganizerEventsPage();

  const { organizerInfo } = useOrganizerEventDetailsPage(resolvedEvent);
  const {
    applications,
    isLoading: isApplicationsLoading,
    approve,
    reject,
  } = useOrganizerEventApplications(resolvedEventId);

  if (!setOrganizerView || !setSelectedEventId) {
    return <AppShellCommon />;
  }

  if (!resolvedEventId) {
    return (
      <div className="w-full text-muted-foreground">
        Не найдено мероприятие.
      </div>
    );
  }

  if (!resolvedEvent) {
    return null;
  }

  const hasApprovedApplications =
    resolvedEvent.participantsCount > 0 ||
    isApplicationsLoading ||
    applications.some((application) => application.status === "APPROVED");

  return (
    <EventDetailsPage
      event={resolvedEvent}
      organizerInfo={organizerInfo}
      role="organizer"
      applications={applications}
      applicationsLoading={isApplicationsLoading}
      canOpenUploadResults={hasApprovedApplications}
      onApproveApplication={(applicationId) => {
        void approve(applicationId);
      }}
      onRejectApplication={(applicationId) => {
        void reject(applicationId);
      }}
      onOpenUploadResults={(id) => {
        setSelectedEventId(id);
        setOrganizerView("upload-results");
        router.replace(`/organizer/upload-results/${id}/form`, { scroll: false });
      }}
      onEditEvent={(id) => {
        setSelectedEventId(id);
        setOrganizerView("edit-event");
        router.replace(`/organizer/edit-event/${id}/form`, { scroll: false });
      }}
      onDeleteEvent={async (id) => {
        if (
          typeof window !== "undefined" &&
          !window.confirm("Удалить мероприятие? Это действие необратимо.")
        ) {
          return;
        }

        try {
          setIsDeletingEvent(true);
          await handleDeleteEvent(id);
          setSelectedEventId(null);
          setOrganizerView("events");
          router.replace("/organizer/events/main", { scroll: false });
        } finally {
          setIsDeletingEvent(false);
        }
      }}
      isDeletingEvent={isDeletingEvent}
      onBack={() => {
        setSelectedEventId(null);
        setOrganizerView("events");
        router.replace("/organizer/events/main", { scroll: false });
      }}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
