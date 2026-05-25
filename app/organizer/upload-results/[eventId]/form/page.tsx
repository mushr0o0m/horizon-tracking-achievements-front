"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { UploadResults } from "@/components/organizer/upload-results";
import { useOrganizerEventApplications } from "@/hooks/use-organizer-event-applications";
import { fetchOrganizerEvents, publishOrganizerResults } from "@/lib/backend-api";
import { toast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import type { Event, OrganizerView, Participant } from "@/lib/types";

interface OrganizerUploadResultsPageProps {
  event?: Event | null;
  setOrganizerView?: (view: OrganizerView) => void;
  setSelectedEventId?: (id: string | null) => void;
  setEvents?: (events: Event[]) => void;
}

export function OrganizerUploadResultsPageContent({
  event,
  setOrganizerView,
  setSelectedEventId,
  setEvents,
}: OrganizerUploadResultsPageProps) {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const resolvedEventId = event?.id ?? params?.eventId ?? null;
  const { applications, isLoading: isParticipantsLoading } =
    useOrganizerEventApplications(resolvedEventId);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusVariant, setStatusVariant] = useState<"default" | "destructive">(
    "default",
  );

  if (!event || !setOrganizerView || !setSelectedEventId || !setEvents) {
    return <AppShellCommon />;
  }

  const handleBack = () => {
    setOrganizerView("events");
    setSelectedEventId(null);
    router.replace("/organizer/events/main", { scroll: false });
  };

  const handlePublish = async (eventId: string, participants: Participant[]) => {
    try {
      const report = await publishOrganizerResults(eventId, participants);
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
      const message =
        report.imported > 0 || report.updatedExisting > 0
          ? `Результаты сохранены: ${report.imported + report.updatedExisting}.`
          : "Результаты обработаны.";
      setStatusVariant("default");
      setStatusMessage(message);
      toast({
        title: "Результаты опубликованы",
        description: message,
      });
    } catch (error) {
      console.warn("Failed to publish results.", error);
      setStatusVariant("destructive");
      setStatusMessage("Не удалось опубликовать результаты.");
      toast({
        title: "Ошибка",
        description: "Не удалось опубликовать результаты.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative">
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border px-4 py-3 shadow-lg ${
            statusVariant === "destructive"
              ? "border-destructive bg-destructive text-destructive-foreground"
              : "border-border bg-background text-foreground"
          }`}>
          <div className="text-sm font-medium">
            {statusVariant === "destructive" ? "Ошибка" : "Уведомление"}
          </div>
          <div className="mt-1 text-sm opacity-90">{statusMessage}</div>
        </div>
      )}
      <UploadResults
        event={event}
        applications={applications}
        loading={isParticipantsLoading}
        onBack={handleBack}
        onPublish={handlePublish}
      />
    </div>
  );
}

export default function Page() {
  return <AppShellCommon />;
}
