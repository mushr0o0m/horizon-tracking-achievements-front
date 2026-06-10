"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { EventForm } from "@/components/organizer/event-form";
import { fetchOrganizerEvents, updateOrganizerEvent } from "@/lib/backend-api";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";
import { useParams } from "next/navigation";
import type { Event, OrganizerView } from "@/lib/types";
import type { EventFormPayload } from "@/stores/events-store";

interface OrganizerEditEventPageProps {
  event?: Event | null;
  selectedEventId?: string | null;
  setOrganizerView?: (view: OrganizerView) => void;
  setSelectedEventId?: (id: string | null) => void;
  setEvents?: (events: Event[]) => void;
}

export function OrganizerEditEventPageContent({
  event,
  selectedEventId,
  setOrganizerView,
  setSelectedEventId,
  setEvents,
}: OrganizerEditEventPageProps) {
  const params = useParams<{ eventId: string }>();
  const resolvedEventId = selectedEventId ?? params?.eventId ?? null;

  if (
    !event ||
    !resolvedEventId ||
    !setOrganizerView ||
    !setSelectedEventId ||
    !setEvents
  ) {
    return <AppShellCommon />;
  }

  const handleBack = () => {
    setOrganizerView("events");
    setSelectedEventId(null);
  };

  const handleSave = async (data: EventFormPayload) => {
    try {
      await updateOrganizerEvent(resolvedEventId, {
        ...data,
        logoUrl: data.logoUrl ?? "",
        bannerUrl: data.bannerUrl ?? "",
        status: data.status ?? "draft",
      });
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
      setSelectedEventId(null);
      setOrganizerView("events");
      showSuccessToast("Мероприятие обновлено");
    } catch (error) {
      console.warn("Failed to update event.", error);
      showErrorToast("Не удалось обновить мероприятие.");
    }
  };

  return <EventForm initialEvent={event} onBack={handleBack} onSave={handleSave} />;
}

export default function Page() {
  return <AppShellCommon />;
}
