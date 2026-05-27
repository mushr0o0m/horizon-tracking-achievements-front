"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { OrganizerCreateEventPageContent } from "@/app/organizer/create-event/form/page";
import { OrganizerEditEventPageContent } from "@/app/organizer/edit-event/[eventId]/form/page";
import { OrganizerEventDetailsPageContent } from "@/app/organizer/event-details/[eventId]/view/page";
import { OrganizerEventsPageContent } from "@/app/organizer/events/page";
import { OrganizerProfileMainPageContent } from "@/app/organizer/profile/main/page";
import { OrganizerUploadResultsPageContent } from "@/app/organizer/upload-results/[eventId]/form/page";
import { OrganizerVerificationRequestsPageContent } from "@/app/organizer/verification-requests/main/page";
import { useOrganizerEvents } from "@/hooks/use-organizer-events";
import { useOrganizerEventsBootstrap } from "@/hooks/use-organizer-events-bootstrap";
import { useOrganizerNotificationsBootstrap } from "@/hooks/use-organizer-notifications-bootstrap";
import { useEventsStore } from "@/stores/events-store";
import { useAchievementsStore } from "@/stores/achievements-store";
import type { AuthUser, OrganizerView } from "@/lib/types";
import { buildPathForCurrentView } from "@/app/shared/routing/app-shell-routes";
import { Spinner } from "@/components/ui/spinner";

interface OrganizerShellContentProps {
  currentUser: AuthUser;
  organizerView: OrganizerView;
  setOrganizerView: (view: OrganizerView) => void;
  setCurrentUser: Dispatch<SetStateAction<AuthUser | null>>;
  handleChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<string | null>;
  handleDeleteAccount: (confirmationText: string) => string | null;
}

export function OrganizerShellContent({
  currentUser,
  organizerView,
  setOrganizerView,
  setCurrentUser,
  handleChangePassword,
  handleDeleteAccount,
}: OrganizerShellContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ eventId?: string }>();
  const { events, setEvents } = useEventsStore();
  const { achievements } = useAchievementsStore();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { isLoading: isEventsLoading, cachedEvents } =
    useOrganizerEventsBootstrap(currentUser.id, true);
  useOrganizerNotificationsBootstrap(currentUser.id, true);

  useEffect(() => {
    if (
      organizerView === "event-details" ||
      organizerView === "edit-event" ||
      organizerView === "upload-results"
    ) {
      return;
    }

    const nextPathBase = buildPathForCurrentView({
      role: "organizer",
      studentView: "home",
      organizerView,
      hrView: "home",
      studentEventsTab: "table",
    });

    if (pathname !== nextPathBase) {
      router.replace(nextPathBase, { scroll: false });
    }
  }, [organizerView, pathname, router]);

  useEffect(() => {
    const eventIdFromPath = params?.eventId ?? null;
    if (
      (organizerView === "event-details" ||
        organizerView === "edit-event" ||
        organizerView === "upload-results") &&
      eventIdFromPath &&
      eventIdFromPath !== selectedEventId
    ) {
      setSelectedEventId(eventIdFromPath);
    }
  }, [organizerView, params?.eventId, selectedEventId]);

  const { organizerVisibleEvents, organizerComputedStats } = useOrganizerEvents(
    events,
    achievements,
    "organizer",
    currentUser,
  );
  const visibleEvents =
    organizerVisibleEvents.length > 0 || events.length > 0
      ? organizerVisibleEvents
      : (cachedEvents ?? organizerVisibleEvents);

  const eventIdFromPath = params?.eventId ?? null;
  const resolvedSelectedEventId = selectedEventId ?? eventIdFromPath;
  const selectedEvent = useMemo(() => {
    if (!resolvedSelectedEventId) return null;
    return (
      events.find((item) => item.id === resolvedSelectedEventId) ??
      cachedEvents?.find((item) => item.id === resolvedSelectedEventId) ??
      null
    );
  }, [events, resolvedSelectedEventId, cachedEvents]);

  if (isEventsLoading && events.length === 0 && !cachedEvents) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }
  console.log(events);
  return (
    <>
      {organizerView === "events" && (
        <OrganizerEventsPageContent
          events={visibleEvents}
          setOrganizerView={setOrganizerView}
          setSelectedEventId={setSelectedEventId}
          setEvents={setEvents}
        />
      )}
      {organizerView === "event-details" && (
        <OrganizerEventDetailsPageContent
          event={selectedEvent}
          eventId={resolvedSelectedEventId}
          setOrganizerView={setOrganizerView}
          setSelectedEventId={setSelectedEventId}
        />
      )}
      {organizerView === "verification-requests" && (
        <OrganizerVerificationRequestsPageContent userId={currentUser.id} />
      )}
      {organizerView === "profile" && (
        <OrganizerProfileMainPageContent
          user={currentUser}
          organizationStats={organizerComputedStats}
          setCurrentUser={setCurrentUser}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      {organizerView === "create-event" && (
        <OrganizerCreateEventPageContent
          defaultContactEmail={currentUser.email}
          setOrganizerView={setOrganizerView}
          setEvents={setEvents}
        />
      )}
      {organizerView === "edit-event" && selectedEvent && (
        <OrganizerEditEventPageContent
          event={selectedEvent}
          selectedEventId={resolvedSelectedEventId}
          setOrganizerView={setOrganizerView}
          setSelectedEventId={setSelectedEventId}
          setEvents={setEvents}
        />
      )}
      {organizerView === "upload-results" && selectedEvent && (
        <OrganizerUploadResultsPageContent
          event={selectedEvent}
          setOrganizerView={setOrganizerView}
          setSelectedEventId={setSelectedEventId}
          setEvents={setEvents}
        />
      )}
    </>
  );
}
