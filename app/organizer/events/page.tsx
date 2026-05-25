"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { OrganizerEvents } from "@/components/organizer/organizer-events";
import { useOrganizerEventsPage } from "@/hooks/use-organizer-events-page";
import { useRouter } from "next/navigation";
import type { Event, OrganizerView } from "@/lib/types";

interface OrganizerEventsPageProps {
  events?: Event[];
  setOrganizerView?: (view: OrganizerView) => void;
  setSelectedEventId?: (id: string | null) => void;
  setEvents?: (events: Event[]) => void;
}

export function OrganizerEventsPageContent({
  events,
  setOrganizerView,
  setSelectedEventId,
  setEvents,
}: OrganizerEventsPageProps) {
  const router = useRouter();
  const { handleDeleteEvent } = useOrganizerEventsPage();

  if (!events || !setOrganizerView || !setSelectedEventId || !setEvents) {
    return <AppShellCommon />;
  }

  const handleCreateEvent = () => {
    setOrganizerView("create-event");
  };

  const handleOpenEvent = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("event-details");
    router.replace(`/organizer/event-details/${id}/view`, { scroll: false });
  };

  const handleEditEvent = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("edit-event");
    router.replace(`/organizer/edit-event/${id}/form`, { scroll: false });
  };

  const handleUploadResults = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("upload-results");
    router.replace(`/organizer/upload-results/${id}/form`, { scroll: false });
  };

  return (
    <OrganizerEvents
      events={events}
      onCreateEvent={handleCreateEvent}
      onOpenEvent={handleOpenEvent}
      onEditEvent={handleEditEvent}
      onDeleteEvent={handleDeleteEvent}
      onUploadResults={handleUploadResults}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
