"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AchievementDetailsModal } from "@/components/student/achievement-details-modal";
import { type StudentEventsFiltersState } from "@/components/student/student-events-page";
import type {
  AuthUser,
  Event,
  OrganizerOrganizationProfile,
} from "@/lib/types";
import type { HrCandidateInvitation } from "@/lib/hr-network";
import type { BadgeViewModel } from "@/lib/badges";
import { buildBadgeViewModels } from "@/lib/badges";
import { calculateStudentMetrics } from "@/lib/metrics";
import { useEventsStore } from "@/stores/events-store";
import { useAchievementsStore } from "@/stores/achievements-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import {
  createStudentAchievement,
  fetchPublicHrProfile,
  fetchPublicOrganizerProfile,
  fetchStudentAchievements,
  fetchStudentInvitations,
  registerStudentForEvent,
  respondToStudentInvitation,
  unregisterStudentForEvent,
  updateStudentProfile,
} from "@/lib/backend-api";
import {
  STUDENT_EVENT_SORT_FIELDS,
  STUDENT_EVENT_SORT_ORDERS,
} from "@/app/shared/student/events";
import {
  buildStudentCreateAchievementPath,
  buildStudentEventDetailsPath,
  buildStudentHrProfilePath,
  buildStudentSubscribersPath,
  buildStudentEventsPath,
  STUDENT_ROUTES,
  resolveStudentRoute,
} from "@/app/shared/routing/app-shell-routes";
import { useStudentEventsBootstrap } from "@/hooks/use-student-events-bootstrap";
import { useStudentAchievementsBootstrap } from "@/hooks/use-student-achievements-bootstrap";
import { useStudentSubscribersBootstrap } from "@/hooks/use-student-subscribers-bootstrap";
import { useStudentNotificationsBootstrap } from "@/hooks/use-student-notifications-bootstrap";
import { StudentHomePageContent } from "@/app/student/home/main/page";
import { StudentEventsPageContent } from "@/app/student/events/table/page";
import { StudentRecommendedEventsPageContent } from "@/app/student/events/recommended/page";
import { StudentDashboardsPageContent } from "@/app/student/dashboards/main/page";
import { StudentAchievementsPageContent } from "@/app/student/achievements/list/page";
import { StudentInvitationsPageContent } from "@/app/student/invitations/list/page";
import { StudentCreateAchievementPageContent } from "@/app/student/create-achievement/form/page";
import { StudentEventDetailsPageContent } from "@/app/student/event-details/view/page";
import { StudentProfilePageContent } from "@/app/student/profile/main/page";
import { StudentSubscribersPageContent } from "@/app/student/subscribers/list/page";
import { StudentHrProfilePageContent } from "@/app/student/hr-profile/view/page";

interface StudentShellContentProps {
  currentUser: AuthUser;
  setCurrentUser: Dispatch<SetStateAction<AuthUser | null>>;
  handleChangePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  handleDeleteAccount: (confirmationText: string) => string | null;
}

interface StudentOrganizerOption {
  id: string;
  label: string;
  email: string;
}

export function StudentShellContent({
  currentUser,
  setCurrentUser,
  handleChangePassword,
  handleDeleteAccount,
}: StudentShellContentProps) {
  const { events, applications } = useEventsStore();
  const { achievements, setAchievements } = useAchievementsStore();
  const { notifications, addNotification } = useNotificationsStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [studentInvitations, setStudentInvitations] = useState<HrCandidateInvitation[]>([]);
  const [studentAppliedEventIds, setStudentAppliedEventIds] = useState<string[]>([]);
  const [selectedEventSnapshot, setSelectedEventSnapshot] = useState<Event | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<string | null>(null);
  const [selectedHrProfileUser, setSelectedHrProfileUser] = useState<AuthUser | null>(null);
  const [selectedEventOrganizerInfo, setSelectedEventOrganizerInfo] = useState<OrganizerOrganizationProfile | null>(null);
  const [visibilitySeededForUserId, setVisibilitySeededForUserId] = useState<string | null>(null);
  const [invitationsLoaded, setInvitationsLoaded] = useState(false);
  const { subscribers: studentSubscribers } = useStudentSubscribersBootstrap(currentUser.id, true);
  useStudentEventsBootstrap(true);
  useStudentAchievementsBootstrap(currentUser.id, true);
  useStudentNotificationsBootstrap(currentUser.id, true);

  const routeState = useMemo(() => resolveStudentRoute(pathname), [pathname]);
  const studentEventsTab = routeState.eventsTab ?? "table";
  const studentEventsFilters = useMemo<StudentEventsFiltersState>(() => ({
    searchQuery: searchParams.get("search") ?? "",
    selectedType: (searchParams.get("type") as Event["type"] | "") ?? "",
    selectedLevel: (searchParams.get("level") as Event["level"] | "") ?? "",
    sortField: STUDENT_EVENT_SORT_FIELDS.includes((searchParams.get("sortField") ?? "") as (typeof STUDENT_EVENT_SORT_FIELDS)[number])
      ? ((searchParams.get("sortField") ?? "date") as StudentEventsFiltersState["sortField"])
      : "date",
    sortOrder: STUDENT_EVENT_SORT_ORDERS.includes((searchParams.get("sortOrder") ?? "") as (typeof STUDENT_EVENT_SORT_ORDERS)[number])
      ? ((searchParams.get("sortOrder") ?? "asc") as StudentEventsFiltersState["sortOrder"])
      : "asc",
  }), [searchParams]);

  const selectedEventId = searchParams.get("eventId") ?? null;
  const selectedHrProfileId = searchParams.get("hrId") ?? null;
  const returnTo = searchParams.get("returnTo") ?? "";
  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    if (routeState.section !== "event-details") return;
    setSelectedEventSnapshot(events.find((event) => event.id === selectedEventId) ?? null);
  }, [events, routeState.section, selectedEventId]);

  const studentAchievements = useMemo(
    () => achievements.filter((item) => item.studentId === currentUser.id),
    [achievements, currentUser.id],
  );
  const selectedAchievement = selectedAchievementId
    ? (studentAchievements.find((item) => item.id === selectedAchievementId) ??
      null)
    : null;

  const studentEventIds = useMemo(
    () => new Set(studentAchievements.map((achievement) => achievement.eventId).filter((eventId): eventId is string => Boolean(eventId))),
    [studentAchievements],
  );

  const availableStudentEvents = useMemo(
    () => events.filter((event) => event.status === "published").filter((event) => !studentEventIds.has(event.id)),
    [events, studentEventIds],
  );

  const recommendedStudentEvents = useMemo(
    () => [...availableStudentEvents].sort((a, b) => new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime()),
    [availableStudentEvents],
  );

  const studentAchievementNotifications = useMemo(
    () => notifications.filter((item) => item.userId === currentUser.id).filter((item) => item.type === "achievement"),
    [currentUser.id, notifications],
  );

  const studentBadges: BadgeViewModel[] = useMemo(() => buildBadgeViewModels(studentAchievements), [studentAchievements]);
  const unlockedBadgeIds = useMemo(
    () => new Set(studentBadges.filter((badge) => badge.unlocked).map((badge) => badge.id)),
    [studentBadges],
  );
  const publicStats = useMemo(() => calculateStudentMetrics(studentAchievements), [studentAchievements]);
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId), [events, selectedEventId]);
  const displayedEvent = selectedEvent ?? selectedEventSnapshot;
  const selectedEventApplications = useMemo(() => selectedEventId ? applications.filter((item) => item.eventId === selectedEventId) : [], [applications, selectedEventId]);
  const isCurrentStudentApplied = Boolean(selectedEventId && studentAppliedEventIds.includes(selectedEventId));
  const selectedAchievementEvent = selectedAchievement?.eventId ? events.find((item) => item.id === selectedAchievement.eventId) : undefined;

  const eventOrganizerInfo: ComponentProps<typeof StudentEventDetailsPageContent>["organizerInfo"] = displayedEvent
    ? selectedEventOrganizerInfo
      ? {
          organizationName: selectedEventOrganizerInfo.organizationName,
          shortName: selectedEventOrganizerInfo.shortName || undefined,
          organizationType: selectedEventOrganizerInfo.organizationType || undefined,
          description: selectedEventOrganizerInfo.description || undefined,
          website: selectedEventOrganizerInfo.website || undefined,
          contactEmail: selectedEventOrganizerInfo.contactEmail || displayedEvent.contactEmail,
          contactPhone: selectedEventOrganizerInfo.contactPhone || undefined,
        }
      : {
          organizationName: "Организатор",
          contactEmail: displayedEvent.contactEmail,
        }
    : undefined;

  const organizerOptions: StudentOrganizerOption[] = useMemo(() => {
    const map = new Map<string, { label: string; email: string }>();
    events.forEach((event) => {
      if (!map.has(event.organizerId)) {
        map.set(event.organizerId, { label: event.contactEmail || event.organizerId, email: event.contactEmail || "" });
      }
    });
    return Array.from(map.entries()).map(([id, value]) => ({ id, label: value.label, email: value.email }));
  }, [events]);

  useEffect(() => {
    if (routeState.section === "invitations" && !invitationsLoaded) {
      let cancelled = false;
      const loadInvitations = async () => {
        try {
          const invitationsData = await fetchStudentInvitations(currentUser.id);
          if (cancelled) return;
          setStudentInvitations(invitationsData);
          setInvitationsLoaded(true);
        } catch (error) {
          if (!cancelled) setStudentInvitations([]);
        }
      };
      loadInvitations();
      return () => {
        cancelled = true;
      };
    }
  }, [currentUser.id, invitationsLoaded, routeState.section]);

  useEffect(() => {
    if (!selectedHrProfileId) {
      setSelectedHrProfileUser(null);
      return;
    }
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const profile = await fetchPublicHrProfile(selectedHrProfileId);
        if (!cancelled) setSelectedHrProfileUser(profile);
      } catch (error) {
        if (!cancelled) setSelectedHrProfileUser(null);
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [selectedHrProfileId]);

  useEffect(() => {
    if (!displayedEvent?.organizerId) {
      setSelectedEventOrganizerInfo(null);
      return;
    }
    let cancelled = false;
    const loadOrganizer = async () => {
      try {
        const profile = await fetchPublicOrganizerProfile(displayedEvent.organizerId);
        if (!cancelled) setSelectedEventOrganizerInfo(profile);
      } catch (error) {
        if (!cancelled) setSelectedEventOrganizerInfo(null);
      }
    };
    loadOrganizer();
    return () => {
      cancelled = true;
    };
  }, [displayedEvent?.organizerId]);

  useEffect(() => {
    if (visibilitySeededForUserId === currentUser.id) return;
    if (currentUser.publicProfile.visibleAchievementIds.length > 0 || studentAchievements.length === 0) {
      setVisibilitySeededForUserId(currentUser.id);
      return;
    }
    const run = async () => {
      try {
        const updated = await updateStudentProfile({
          visibleAchievementIds: studentAchievements.slice(0, 10).map((item) => item.id),
        });
        setCurrentUser(updated);
        setVisibilitySeededForUserId(currentUser.id);
      } catch (error) {
        console.warn("Failed to seed visible achievements.", error);
      }
    };
    run();
  }, [currentUser, setCurrentUser, studentAchievements, visibilitySeededForUserId]);

  useEffect(() => {
    const currentIds = currentUser.publicProfile.visibleBadgeIds;
    const normalizedIds = Array.from(new Set(currentIds)).filter((id) => unlockedBadgeIds.has(id));
    const isSameLength = normalizedIds.length === currentIds.length;
    const isSameContent = isSameLength && normalizedIds.every((id, index) => id === currentIds[index]);
    if (isSameContent) return;
    const run = async () => {
      try {
        const updated = await updateStudentProfile({ visibleBadgeIds: normalizedIds });
        setCurrentUser(updated);
      } catch (error) {
        console.warn("Failed to normalize visible badges.", error);
      }
    };
    run();
  }, [currentUser, setCurrentUser, unlockedBadgeIds]);

  const handleOpenStudentEvent = useCallback(
    (id: string, nextReturnTo: string) => {
      setSelectedEventSnapshot(events.find((event) => event.id === id) ?? null);
      router.push(buildStudentEventDetailsPath(id, nextReturnTo), {
        scroll: false,
      });
    },
    [events, router],
  );

  const handleOpenAchievement = useCallback((achievementId: string) => {
    setSelectedAchievementId(achievementId);
  }, []);

  const handleStudentInvitationResponse = useCallback(
    (invitationId: string, response: "accepted" | "rejected"): string | null => {
      const run = async () => {
        try {
          const updatedInvitation = await respondToStudentInvitation(invitationId, response, currentUser.id);
          setStudentInvitations((prev) => prev.map((item) => (item.id === invitationId ? updatedInvitation : item)));
        } catch (error) {
          console.warn("Failed to respond to invitation.", error);
        }
      };
      run();
      return null;
    },
    [currentUser.id],
  );

  const handleToggleAchievementVisibility = useCallback(
    async (achievementId: string, nextVisible: boolean) => {
      const profile = currentUser.publicProfile;
      const currentSet = new Set(profile.visibleAchievementIds);
      if (nextVisible) currentSet.add(achievementId);
      else currentSet.delete(achievementId);

      const nextIds = Array.from(currentSet);
      if (nextIds.length > 10) {
        addNotification(currentUser.id, "Лимит витрины достижений", "Можно показать не более 10 достижений в публичной визитке.", "system");
        return;
      }

      try {
        const updated = await updateStudentProfile({ visibleAchievementIds: nextIds });
        setCurrentUser(updated);
      } catch (error) {
        console.warn("Failed to update achievement visibility.", error);
      }
    },
    [addNotification, currentUser, setCurrentUser],
  );

  const handleToggleBadgeVisibility = useCallback(
    async (badgeId: string) => {
      const profile = currentUser.publicProfile;
      const currentSet = new Set(profile.visibleBadgeIds.filter((id) => unlockedBadgeIds.has(id)));
      if (currentSet.has(badgeId)) currentSet.delete(badgeId);
      else currentSet.add(badgeId);

      const nextIds = Array.from(currentSet);
      if (nextIds.length > 3) {
        addNotification(currentUser.id, "Лимит витрины значков", "Можно показать не более 3 значков в публичной визитке.", "system");
        return;
      }

      try {
        const updated = await updateStudentProfile({ visibleBadgeIds: nextIds });
        setCurrentUser(updated);
      } catch (error) {
        console.warn("Failed to update badge visibility.", error);
      }
    },
    [addNotification, currentUser, setCurrentUser, unlockedBadgeIds],
  );

  const handleToggleApplication = useCallback(
    async (eventId: string) => {
      const isApplied = studentAppliedEventIds.includes(eventId);
      try {
        if (isApplied) {
          await unregisterStudentForEvent(eventId);
          setStudentAppliedEventIds((prev) => prev.filter((id) => id !== eventId));
        } else {
          await registerStudentForEvent(eventId);
          setStudentAppliedEventIds((prev) => [...prev, eventId]);
        }
      } catch (error) {
        console.warn("Failed to update event application.", error);
      }
    },
    [studentAppliedEventIds],
  );

  const createStudentAchievementSubmit: ComponentProps<typeof StudentCreateAchievementPageContent>["onSubmit"] = useCallback((payload) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const achievementDate = new Date(`${payload.date}T00:00:00`);
    if (Number.isNaN(achievementDate.getTime()) || achievementDate >= today) {
      addNotification(currentUser.id, "Ошибка запроса", "Достижение можно добавить только за прошедшую дату.", "system");
      return;
    }

    const selectedOrganizer = organizerOptions.find((item) => item.id === payload.requestedOrganizerId);
    const descriptionParts: string[] = [];
    if (payload.requestComment?.trim()) descriptionParts.push(payload.requestComment.trim());
    if (payload.eventNotInList && payload.newEvent) {
      descriptionParts.push(`Мероприятие вне списка: ${payload.newEvent.title}. ${payload.newEvent.description}`);
      if (payload.newEvent.location) descriptionParts.push(`Локация: ${payload.newEvent.location}`);
      if (payload.newEvent.registrationDeadline) descriptionParts.push(`Дедлайн регистрации: ${payload.newEvent.registrationDeadline}`);
      if (payload.newEvent.website) descriptionParts.push(`Сайт: ${payload.newEvent.website}`);
      if (payload.newEvent.contactEmail) descriptionParts.push(`Контакт: ${payload.newEvent.contactEmail}`);
    }

    const run = async () => {
      try {
        const created = await createStudentAchievement({
          title: payload.title,
          type: payload.eventType,
          level: payload.level,
          date: payload.date,
          result: payload.result,
          eventId: payload.eventNotInList ? undefined : payload.eventId,
          organizerName: payload.eventNotInList ? selectedOrganizer?.label || "" : undefined,
          description: descriptionParts.join("\n"),
        });

        const refreshed = await fetchStudentAchievements(currentUser.id);
        setAchievements(refreshed);

        const profile = currentUser.publicProfile;
        if (!profile.visibleAchievementIds.includes(created.id)) {
          const nextVisible = [created.id, ...profile.visibleAchievementIds].slice(0, 10);
          const updated = await updateStudentProfile({ visibleAchievementIds: nextVisible });
          setCurrentUser(updated);
        }

        router.push(STUDENT_ROUTES.achievements, { scroll: false });
      } catch (error) {
        console.warn("Failed to create achievement.", error);
        addNotification(currentUser.id, "Ошибка запроса", "Не удалось отправить запрос на достижение.", "system");
      }
    };

    run();
  }, [addNotification, currentUser, organizerOptions, router, setAchievements, setCurrentUser]);

  const handleBackFromEvent = useCallback(() => {
    router.replace(returnTo || STUDENT_ROUTES.home, { scroll: false });
  }, [returnTo, router]);

  const handleBackFromSubscribers = useCallback(() => {
    router.replace(returnTo || STUDENT_ROUTES.profile, { scroll: false });
  }, [returnTo, router]);

  const visibleBadgeIds = useMemo(() => currentUser.publicProfile.visibleBadgeIds.filter((id) => unlockedBadgeIds.has(id)), [currentUser.publicProfile.visibleBadgeIds, unlockedBadgeIds]);

  return (
    <>
      {routeState.section === "home" && (
        <StudentHomePageContent
          currentUser={currentUser}
          onOpenSubscribers={() =>
            router.push(
              buildStudentSubscribersPath(STUDENT_ROUTES.home),
              { scroll: false },
            )
          }
          onOpenEvent={(eventId) =>
            handleOpenStudentEvent(eventId, currentUrl)
          }
          onOpenAchievement={handleOpenAchievement}
          onOpenRecommendedEvents={() =>
            router.push(buildStudentEventsPath("recommended"), {
              scroll: false,
            })
          }
        />
      )}
      {routeState.section === "events" && (
        <>
          {studentEventsTab === "recommended" ? (
            <StudentRecommendedEventsPageContent
              events={availableStudentEvents}
              recommendedEvents={recommendedStudentEvents}
              activeTab={studentEventsTab}
              onTabChange={(tab) =>
                router.push(buildStudentEventsPath(tab), { scroll: false })
              }
              filtersState={studentEventsFilters}
              onFiltersStateChange={(next) => {
                const params = new URLSearchParams();
                if (next.searchQuery.trim()) {
                  params.set("search", next.searchQuery.trim());
                }
                if (next.selectedType) params.set("type", next.selectedType);
                if (next.selectedLevel) params.set("level", next.selectedLevel);
                if (next.sortField !== "date") params.set("sortField", next.sortField);
                if (next.sortOrder !== "asc") params.set("sortOrder", next.sortOrder);
                router.replace(
                  `${buildStudentEventsPath(studentEventsTab)}${
                    params.toString() ? `?${params}` : ""
                  }`,
                  { scroll: false },
                );
              }}
              onOpenEvent={(eventId) =>
                handleOpenStudentEvent(
                  eventId,
                  `${buildStudentEventsPath(studentEventsTab)}${
                    searchParams.toString() ? `?${searchParams.toString()}` : ""
                  }`,
                )
              }
            />
          ) : (
            <StudentEventsPageContent
              events={availableStudentEvents}
              recommendedEvents={recommendedStudentEvents}
              activeTab={studentEventsTab}
              onTabChange={(tab) =>
                router.push(buildStudentEventsPath(tab), { scroll: false })
              }
              filtersState={studentEventsFilters}
              onFiltersStateChange={(next) => {
                const params = new URLSearchParams();
                if (next.searchQuery.trim()) {
                  params.set("search", next.searchQuery.trim());
                }
                if (next.selectedType) params.set("type", next.selectedType);
                if (next.selectedLevel) params.set("level", next.selectedLevel);
                if (next.sortField !== "date") params.set("sortField", next.sortField);
                if (next.sortOrder !== "asc") params.set("sortOrder", next.sortOrder);
                router.replace(
                  `${buildStudentEventsPath(studentEventsTab)}${
                    params.toString() ? `?${params}` : ""
                  }`,
                  { scroll: false },
                );
              }}
              onOpenEvent={(eventId) =>
                handleOpenStudentEvent(
                  eventId,
                  `${buildStudentEventsPath(studentEventsTab)}${
                    searchParams.toString() ? `?${searchParams.toString()}` : ""
                  }`,
                )
              }
            />
          )}
        </>
      )}
      {routeState.section === "dashboards" && (
        <StudentDashboardsPageContent achievements={studentAchievements} />
      )}
      {routeState.section === "achievements" && (
        <StudentAchievementsPageContent
          achievements={studentAchievements}
          events={events}
          onOpenEvent={(eventId) =>
            handleOpenStudentEvent(eventId, currentUrl)
          }
          onOpenAchievement={handleOpenAchievement}
          onCreateAchievement={() =>
            router.push(
              buildStudentCreateAchievementPath(STUDENT_ROUTES.achievements),
              { scroll: false },
            )
          }
          achievementNotifications={studentAchievementNotifications}
          visibleBadgeIds={visibleBadgeIds}
          onToggleBadgeVisibility={handleToggleBadgeVisibility}
        />
      )}
      {routeState.section === "invitations" && (
        <StudentInvitationsPageContent
          invitations={studentInvitations}
          onRespond={handleStudentInvitationResponse}
        />
      )}
      {routeState.section === "create-achievement" && (
        <StudentCreateAchievementPageContent
          organizerOptions={organizerOptions}
          events={events}
          onBack={() =>
            router.replace(returnTo || STUDENT_ROUTES.achievements, {
              scroll: false,
            })
          }
          onSubmit={createStudentAchievementSubmit}
        />
      )}
      {routeState.section === "event-details" && displayedEvent && (
        <StudentEventDetailsPageContent
          event={displayedEvent}
          organizerInfo={eventOrganizerInfo}
          applications={selectedEventApplications}
          isApplied={isCurrentStudentApplied}
          onToggleApplication={() => handleToggleApplication(displayedEvent.id)}
          onBack={handleBackFromEvent}
        />
      )}
      {routeState.section === "profile" && (
        <StudentProfilePageContent
          user={currentUser}
          achievements={studentAchievements}
          badges={studentBadges}
          subscribers={studentSubscribers}
          onOpenSubscribers={() =>
            router.push(
              buildStudentSubscribersPath(STUDENT_ROUTES.profile),
              { scroll: false },
            )
          }
          setCurrentUser={setCurrentUser}
          publicStats={publicStats}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      {routeState.section === "subscribers" && (
        <StudentSubscribersPageContent
          subscribers={studentSubscribers}
          onBack={handleBackFromSubscribers}
          onOpenSubscriber={(hrId) =>
            router.push(buildStudentHrProfilePath(hrId, currentUrl), {
              scroll: false,
            })
          }
        />
      )}
      {routeState.section === "hr-profile" && (
        <StudentHrProfilePageContent
          hrUser={selectedHrProfileUser}
          onBack={() =>
            router.replace(returnTo || STUDENT_ROUTES.subscribers, {
              scroll: false,
            })
          }
        />
      )}
      <AchievementDetailsModal
        achievement={selectedAchievement}
        event={selectedAchievementEvent}
        isVisibleInPublic={selectedAchievement ? currentUser.publicProfile.visibleAchievementIds.includes(selectedAchievement.id) : false}
        onToggleVisible={(nextValue) => {
          if (!selectedAchievement) return;
          handleToggleAchievementVisibility(selectedAchievement.id, nextValue);
        }}
        onClose={() => setSelectedAchievementId(null)}
        onOpenEvent={(eventId) => {
          handleOpenStudentEvent(eventId, STUDENT_ROUTES.achievements);
          setSelectedAchievementId(null);
        }}
      />
    </>
  );
}
