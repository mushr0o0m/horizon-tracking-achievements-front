"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { UploadResults } from "@/components/organizer/upload-results";
import { useOrganizerEventApplications } from "@/hooks/use-organizer-event-applications";
import { fetchOrganizerEvents, publishOrganizerResults } from "@/lib/backend-api";
import { toast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
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
      toast({
        title: "Результаты опубликованы",
        description: message,
      });
    } catch (error) {
      console.warn("Failed to publish results.", error);
      toast({
        title: "Ошибка",
        description: "Не удалось опубликовать результаты.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative">
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
