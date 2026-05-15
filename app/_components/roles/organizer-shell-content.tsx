"use client";

import { useEffect, useMemo, useState, type ComponentProps, type Dispatch, type SetStateAction } from "react";
import { useRouter, usePathname } from "next/navigation";
import { OrganizerEvents } from "@/components/organizer/organizer-events";
import { EventDetailsPage } from "@/components/shared/event-details-page";
import { VerificationRequestsPage } from "@/components/organizer/verification-requests-page";
import { OrganizerProfilePage } from "@/components/organizer/organizer-profile-page";
import { EventForm } from "@/components/organizer/event-form";
import { UploadResults } from "@/components/organizer/upload-results";
import { useOrganizerEvents } from "@/hooks/use-organizer-events";
import { useEventsStore } from "@/stores/events-store";
import { useAchievementsStore } from "@/stores/achievements-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import type {
  AuthUser,
  EventApplication,
  OrganizerOrganizationProfile,
  OrganizerView,
  Participant,
} from "@/lib/types";
import type { EventFormPayload } from "@/stores/events-store";
import {
  createOrganizerEvent,
  deleteOrganizerEvent,
  fetchOrganizerEventParticipants,
  fetchOrganizerEvents,
  fetchOrganizerVerificationRequests,
  fetchPublicOrganizerProfile,
  publishOrganizerResults,
  rejectAchievementRequest,
  fetchNotifications,
  updateOrganizerEvent,
  verifyAchievementRequest,
} from "@/lib/backend-api";
import { buildPathForCurrentView } from "@/app/shared/routing/app-shell-routes";

interface OrganizerShellContentProps {
  currentUser: AuthUser;
  organizerView: OrganizerView;
  setOrganizerView: (view: OrganizerView) => void;
  setCurrentUser: Dispatch<SetStateAction<AuthUser | null>>;
  handleChangePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
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
  const { events, setEvents } = useEventsStore();
  const { achievements, setAchievements } = useAchievementsStore();
  const { setNotifications } = useNotificationsStore();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEventApplications, setSelectedEventApplications] = useState<
    EventApplication[]
  >([]);
  const [selectedEventOrganizerInfo, setSelectedEventOrganizerInfo] =
    useState<OrganizerOrganizationProfile | null>(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [requestsLoaded, setRequestsLoaded] = useState(false);

  useEffect(() => {
    const nextPath = buildPathForCurrentView({
      role: "organizer",
      studentView: "home",
      organizerView,
      hrView: "home",
      studentEventsTab: "table",
    });
    if (pathname !== nextPath) {
      router.replace(nextPath, { scroll: false });
    }
  }, [organizerView, pathname, router]);

  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const notifications = await fetchNotifications(currentUser.id);
        if (!cancelled) {
          setNotifications(notifications);
        }
      } catch (error) {
        if (!cancelled) {
          setNotifications([]);
        }
      }
    };
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id, setNotifications]);

  useEffect(() => {
    if (
      eventsLoaded ||
      !["events", "event-details", "create-event", "edit-event", "upload-results"].includes(
        organizerView,
      )
    ) {
      return;
    }
    let cancelled = false;
    const loadEvents = async () => {
      try {
        const data = await fetchOrganizerEvents();
        if (!cancelled) {
          setEvents(data);
          setEventsLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setEvents([]);
        }
      }
    };
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [eventsLoaded, organizerView, setEvents]);

  useEffect(() => {
    if (requestsLoaded || organizerView !== "verification-requests") return;
    let cancelled = false;
    const loadRequests = async () => {
      try {
        const data = await fetchOrganizerVerificationRequests();
        if (!cancelled) {
          setAchievements(data);
          setRequestsLoaded(true);
        }
      } catch (error) {
        if (!cancelled) {
          setAchievements([]);
        }
      }
    };
    loadRequests();
    return () => {
      cancelled = true;
    };
  }, [organizerView, requestsLoaded, setAchievements]);

  const { organizerVisibleEvents, organizerComputedStats } = useOrganizerEvents(
    events,
    achievements,
    "organizer",
    currentUser,
  );

  const selectedEvent = useMemo(
    () => events.find((item) => item.id === selectedEventId),
    [events, selectedEventId],
  );

  const organizerVerificationRequests = useMemo(
    () => achievements,
    [achievements],
  );

  const eventOrganizerInfo = selectedEvent
    ? selectedEventOrganizerInfo
      ? {
          organizationName: selectedEventOrganizerInfo.organizationName,
          shortName: selectedEventOrganizerInfo.shortName || undefined,
          organizationType:
            selectedEventOrganizerInfo.organizationType || undefined,
          description: selectedEventOrganizerInfo.description || undefined,
          website: selectedEventOrganizerInfo.website || undefined,
          contactEmail:
            selectedEventOrganizerInfo.contactEmail ||
            selectedEvent.contactEmail,
          contactPhone: selectedEventOrganizerInfo.contactPhone || undefined,
        }
      : {
          organizationName: "Организатор",
          contactEmail: selectedEvent.contactEmail,
        }
    : undefined;

  const handleCreateEvent = async (data: EventFormPayload) => {
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
    } catch (error) {
      console.warn("Failed to create event.", error);
    }
  };

  const handleEditEvent = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("edit-event");
  };

  const handleSaveEdit = async (data: EventFormPayload) => {
    if (!selectedEventId) return;
    try {
      await updateOrganizerEvent(selectedEventId, {
        ...data,
        logoUrl: data.logoUrl ?? "",
        bannerUrl: data.bannerUrl ?? "",
        status: data.status ?? "draft",
      });
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
      setSelectedEventId(null);
      setOrganizerView("events");
    } catch (error) {
      console.warn("Failed to update event.", error);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteOrganizerEvent(id);
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
    } catch (error) {
      console.warn("Failed to delete event.", error);
    }
  };

  const handleUploadResults = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("upload-results");
  };

  const handleOpenOrganizerEvent = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("event-details");
  };

  const handlePublishResults = async (
    eventId: string,
    participants: Participant[],
  ) => {
    try {
      await publishOrganizerResults(eventId, participants);
      const refreshed = await fetchOrganizerEvents();
      setEvents(refreshed);
      setSelectedEventId(null);
      setOrganizerView("events");
    } catch (error) {
      console.warn("Failed to publish results.", error);
    }
  };

  const handleReviewRequest = (
    achievementId: string,
    decision: "Подтверждено" | "Отклонено",
    comment?: string,
  ) => {
    const run = async () => {
      try {
        if (decision === "Подтверждено") {
          await verifyAchievementRequest(achievementId, comment);
        } else {
          await rejectAchievementRequest(achievementId, comment);
        }
        const refreshed = await fetchOrganizerVerificationRequests();
        setAchievements(refreshed);
      } catch (error) {
        console.warn("Failed to review achievement request.", error);
      }
    };
    run();
  };

  useEffect(() => {
    if (!selectedEventId) {
      setSelectedEventApplications([]);
      return;
    }
    let cancelled = false;
    const loadParticipants = async () => {
      try {
        const items = await fetchOrganizerEventParticipants(selectedEventId);
        if (!cancelled) {
          setSelectedEventApplications(items);
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedEventApplications([]);
        }
      }
    };
    loadParticipants();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedEvent?.organizerId) {
      setSelectedEventOrganizerInfo(null);
      return;
    }
    let cancelled = false;
    const loadOrganizer = async () => {
      try {
        const profile = await fetchPublicOrganizerProfile(selectedEvent.organizerId);
        if (!cancelled) {
          setSelectedEventOrganizerInfo(profile);
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedEventOrganizerInfo(null);
        }
      }
    };
    loadOrganizer();
    return () => {
      cancelled = true;
    };
  }, [selectedEvent?.organizerId]);

  return (
    <>
      {organizerView === "events" && (
        <OrganizerEvents
          events={organizerVisibleEvents}
          onCreateEvent={() => setOrganizerView("create-event")}
          onOpenEvent={handleOpenOrganizerEvent}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onUploadResults={handleUploadResults}
        />
      )}
      {organizerView === "event-details" && selectedEvent && (
        <EventDetailsPage
          event={selectedEvent}
          organizerInfo={eventOrganizerInfo}
          role="organizer"
          applications={selectedEventApplications}
          onOpenUploadResults={handleUploadResults}
          onBack={() => {
            setSelectedEventId(null);
            setOrganizerView("events");
          }}
        />
      )}
      {organizerView === "verification-requests" && (
        <VerificationRequestsPage
          requests={organizerVerificationRequests}
          onApprove={(achievementId, comment) =>
            handleReviewRequest(achievementId, "Подтверждено", comment)
          }
          onReject={(achievementId, comment) =>
            handleReviewRequest(achievementId, "Отклонено", comment)
          }
        />
      )}
      {organizerView === "profile" && (
        <OrganizerProfilePage
          user={currentUser}
          organizationStats={organizerComputedStats}
          setCurrentUser={setCurrentUser}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      {organizerView === "create-event" && (
        <EventForm
          defaultContactEmail={currentUser.email}
          onBack={() => setOrganizerView("events")}
          onSave={handleCreateEvent}
        />
      )}
      {organizerView === "edit-event" && selectedEvent && (
        <EventForm
          initialEvent={selectedEvent}
          onBack={() => {
            setOrganizerView("events");
            setSelectedEventId(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
      {organizerView === "upload-results" && selectedEvent && (
        <UploadResults
          event={selectedEvent}
          applications={selectedEventApplications}
          onBack={() => {
            setOrganizerView("events");
            setSelectedEventId(null);
          }}
          onPublish={handlePublishResults}
        />
      )}
    </>
  );
}
