"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { EventForm } from "@/components/organizer/event-form";
import { createOrganizerEvent, fetchOrganizerEvents } from "@/lib/backend-api";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";
import type { Event, OrganizerView } from "@/lib/types";
import type { EventFormPayload } from "@/stores/events-store";

interface OrganizerCreateEventPageProps {
  defaultContactEmail?: string;
  setOrganizerView?: (view: OrganizerView) => void;
  setEvents?: (events: Event[]) => void;
}

export function OrganizerCreateEventPageContent({
  defaultContactEmail,
  setOrganizerView,
  setEvents,
}: OrganizerCreateEventPageProps) {
  if (!setOrganizerView || !setEvents) {
    return <AppShellCommon />;
  }

  const handleBack = () => {
    setOrganizerView("events");
  };

  const handleSave = async (data: EventFormPayload) => {
    try {
      await createOrganizerEvent({
        ...data,
        logoUrl: data.logoUrl ?? "",
        bannerUrl: data.bannerUrl ?? "",
        status: data.status ?? "draft",
      });
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
      setOrganizerView("events");
      showSuccessToast("Мероприятие создано");
    } catch (error) {
      console.warn("Failed to create event.", error);
      showErrorToast("Не удалось создать мероприятие.");
    }
  };

  return (
    <EventForm
      defaultContactEmail={defaultContactEmail}
      onBack={handleBack}
      onSave={handleSave}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
