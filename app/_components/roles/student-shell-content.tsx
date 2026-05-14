"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AchievementDetailsModal } from "@/components/student/achievement-details-modal";
import { type StudentEventsFiltersState, type StudentEventsTab } from "@/components/student/student-events-page";
import { AchievementRequestForm } from "@/components/student/achievement-request-form";
import { EventDetailsPage } from "@/components/shared/event-details-page";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import { StudentHomeSection } from "@/app/student/home/main/section";
import { StudentEventsSection } from "@/app/student/events/table/section";
import { StudentDashboardsSection } from "@/app/student/dashboards/main/section";
import { StudentAchievementsSection } from "@/app/student/achievements/list/section";
import { StudentInvitationsSection } from "@/app/student/invitations/list/section";
import { StudentCreateAchievementSection } from "@/app/student/create-achievement/form/section";
import { StudentEventDetailsSection } from "@/app/student/event-details/view/section";
import { StudentProfileSection } from "@/app/student/profile/main/section";
import { StudentSubscribersSection } from "@/app/student/subscribers/list/section";
import { StudentHrProfileSection } from "@/app/student/hr-profile/view/section";
import type {
  Achievement,
  AuthUser,
  Event,
  OrganizerOrganizationProfile,
  StudentView,
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
  fetchNotifications,
  fetchPublicEvents,
  fetchPublicHrProfile,
  fetchPublicOrganizerProfile,
  fetchStudentAchievements,
  fetchStudentInvitations,
  fetchStudentSubscribers,
  registerStudentForEvent,
  respondToStudentInvitation,
  unregisterStudentForEvent,
  updateStudentProfile,
} from "@/lib/backend-api";
import {
  STUDENT_EVENT_SORT_FIELDS,
  STUDENT_EVENT_SORT_ORDERS,
} from "@/app/shared/student/events";
import { buildPathForCurrentView } from "@/app/shared/routing/app-shell-routes";
import {
  normalizeStudentViewFromPath,
  parsePathParts,
} from "@/app/shared/routing/view-mappers";

interface StudentOrganizerOption {
  id: string;
  label: string;
  email: string;
}

interface StudentShellContentProps {
  currentUser: AuthUser;
  studentView: StudentView;
  setStudentView: (view: StudentView) => void;
  setCurrentUser: Dispatch<SetStateAction<AuthUser | null>>;
  studentEventsTab: StudentEventsTab;
  setStudentEventsTab: (tab: StudentEventsTab) => void;
  studentEventsFilters: StudentEventsFiltersState;
  setStudentEventsFilters: (next: StudentEventsFiltersState) => void;
  handleChangePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  handleDeleteAccount: (confirmationText: string) => string | null;
}

export function StudentShellContent({
  currentUser,
  studentView,
  setStudentView,
  setCurrentUser,
  studentEventsTab,
  setStudentEventsTab,
  studentEventsFilters,
  setStudentEventsFilters,
  handleChangePassword,
  handleDeleteAccount,
}: StudentShellContentProps) {
  const { events, applications, setEvents } = useEventsStore();
  const { achievements, setAchievements } = useAchievementsStore();
  const { notifications, setNotifications, addNotification } =
    useNotificationsStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isApplyingUrlStateRef = useRef(false);

  const [studentInvitations, setStudentInvitations] = useState<
    HrCandidateInvitation[]
  >([]);
  const [studentSubscribers, setStudentSubscribers] = useState<
    SubscriberPreviewItem[]
  >([]);
  const [studentAppliedEventIds, setStudentAppliedEventIds] = useState<
    string[]
  >([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<
    string | null
  >(null);
  const [selectedHrProfileId, setSelectedHrProfileId] = useState<string | null>(
    null,
  );
  const [selectedHrProfileUser, setSelectedHrProfileUser] =
    useState<AuthUser | null>(null);
  const [studentSubscribersReturnView, setStudentSubscribersReturnView] =
    useState<"home" | "profile">("home");
  const [studentEventReturnView, setStudentEventReturnView] = useState<
    "home" | "achievements" | "events"
  >("home");
  const [selectedEventOrganizerInfo, setSelectedEventOrganizerInfo] =
    useState<OrganizerOrganizationProfile | null>(null);
  const [visibilitySeededForUserId, setVisibilitySeededForUserId] = useState<
    string | null
  >(null);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);
  const [invitationsLoaded, setInvitationsLoaded] = useState(false);
  const [subscribersLoaded, setSubscribersLoaded] = useState(false);

  useEffect(() => {
    const pathParts = parsePathParts(pathname);
    if (pathParts.role !== "student") return;

    isApplyingUrlStateRef.current = true;
    const mapped = normalizeStudentViewFromPath(pathParts.section, pathParts.tab);
    setStudentView(mapped.view);
    if (mapped.eventsTab) {
      setStudentEventsTab(mapped.eventsTab);
    }
    setStudentEventsFilters({
      searchQuery: searchParams.get("search") ?? "",
      selectedType: (searchParams.get("type") as Event["type"] | "") ?? "",
      selectedLevel: (searchParams.get("level") as Event["level"] | "") ?? "",
      sortField: STUDENT_EVENT_SORT_FIELDS.includes(
        (searchParams.get("sortField") ??
          "") as (typeof STUDENT_EVENT_SORT_FIELDS)[number],
      )
        ? ((searchParams.get("sortField") ?? "date") as StudentEventsFiltersState["sortField"])
        : "date",
      sortOrder: STUDENT_EVENT_SORT_ORDERS.includes(
        (searchParams.get("sortOrder") ??
          "") as (typeof STUDENT_EVENT_SORT_ORDERS)[number],
      )
        ? ((searchParams.get("sortOrder") ?? "asc") as StudentEventsFiltersState["sortOrder"])
        : "asc",
    });
    queueMicrotask(() => {
      isApplyingUrlStateRef.current = false;
    });
  }, [pathname, searchParams, setStudentEventsTab, setStudentView, setStudentEventsFilters]);

  useEffect(() => {
    if (isApplyingUrlStateRef.current) return;
    const nextPath = buildPathForCurrentView({
      role: "student",
      studentView,
      organizerView: "events",
      hrView: "home",
      studentEventsTab,
    });
    const nextParams = new URLSearchParams();
    if (studentView === "events") {
      if (studentEventsFilters.searchQuery.trim()) {
        nextParams.set("search", studentEventsFilters.searchQuery.trim());
      }
      if (studentEventsFilters.selectedType) {
        nextParams.set("type", studentEventsFilters.selectedType);
      }
      if (studentEventsFilters.selectedLevel) {
        nextParams.set("level", studentEventsFilters.selectedLevel);
      }
      if (studentEventsFilters.sortField !== "date") {
        nextParams.set("sortField", studentEventsFilters.sortField);
      }
      if (studentEventsFilters.sortOrder !== "asc") {
        nextParams.set("sortOrder", studentEventsFilters.sortOrder);
      }
    }
    const nextUrl = `${nextPath}${
      nextParams.toString() ? `?${nextParams.toString()}` : ""
    }`;
    const currentUrl = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [pathname, router, searchParams, studentEventsFilters, studentEventsTab, studentView]);

  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const notificationsData = await fetchNotifications(currentUser.id);
        if (cancelled) return;
        setNotifications(notificationsData);
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
      !["home", "events", "event-details", "create-achievement"].includes(
        studentView,
      )
    ) {
      return;
    }
    let cancelled = false;
    const loadEvents = async () => {
      try {
        const eventsData = await fetchPublicEvents();
        if (cancelled) return;
        setEvents(eventsData);
        setEventsLoaded(true);
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
  }, [eventsLoaded, setEvents, studentView]);

  useEffect(() => {
    if (
      achievementsLoaded ||
      ![
        "home",
        "achievements",
        "dashboards",
        "profile",
        "create-achievement",
      ].includes(studentView)
    ) {
      return;
    }
    let cancelled = false;
    const loadAchievements = async () => {
      try {
        const achievementsData = await fetchStudentAchievements(currentUser.id);
        if (cancelled) return;
        setAchievements(achievementsData);
        setAchievementsLoaded(true);
      } catch (error) {
        if (!cancelled) {
          setAchievements([]);
        }
      }
    };
    loadAchievements();
    return () => {
      cancelled = true;
    };
  }, [achievementsLoaded, currentUser.id, setAchievements, studentView]);

  const studentAchievements = useMemo(
    () => achievements.filter((item) => item.studentId === currentUser.id),
    [achievements, currentUser.id],
  );

  const studentEventIds = useMemo(
    () =>
      new Set(
        studentAchievements
          .map((achievement) => achievement.eventId)
          .filter((eventId): eventId is string => Boolean(eventId)),
      ),
    [studentAchievements],
  );

  const availableStudentEvents = useMemo(
    () =>
      events
        .filter((event) => event.status === "published")
        .filter((event) => !studentEventIds.has(event.id)),
    [events, studentEventIds],
  );

  const recommendedStudentEvents = useMemo(
    () =>
      [...availableStudentEvents].sort(
        (a, b) =>
          new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime(),
      ),
    [availableStudentEvents],
  );

  const studentAchievementNotifications = useMemo(
    () =>
      notifications
        .filter((item) => item.userId === currentUser.id)
        .filter((item) => item.type === "achievement"),
    [currentUser.id, notifications],
  );

  const studentBadges: BadgeViewModel[] = useMemo(
    () => buildBadgeViewModels(studentAchievements),
    [studentAchievements],
  );
  const unlockedBadgeIds = useMemo(
    () =>
      new Set(
        studentBadges.filter((badge) => badge.unlocked).map((badge) => badge.id),
      ),
    [studentBadges],
  );
  const publicStats = useMemo(
    () => calculateStudentMetrics(studentAchievements),
    [studentAchievements],
  );

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );
  const selectedEventApplications = useMemo(
    () =>
      selectedEventId
        ? applications.filter((item) => item.eventId === selectedEventId)
        : [],
    [applications, selectedEventId],
  );
  const isCurrentStudentApplied = Boolean(
    selectedEventId && studentAppliedEventIds.includes(selectedEventId),
  );

  const selectedAchievement = selectedAchievementId
    ? (studentAchievements.find((item) => item.id === selectedAchievementId) ??
      null)
    : null;
  const selectedAchievementEvent = selectedAchievement?.eventId
    ? events.find((item) => item.id === selectedAchievement.eventId)
    : undefined;

  const eventOrganizerInfo: ComponentProps<
    typeof EventDetailsPage
  >["organizerInfo"] = selectedEvent
    ? selectedEventOrganizerInfo
      ? {
          organizationName: selectedEventOrganizerInfo.organizationName,
          shortName: selectedEventOrganizerInfo.shortName || undefined,
          organizationType:
            selectedEventOrganizerInfo.organizationType || undefined,
          description: selectedEventOrganizerInfo.description || undefined,
          website: selectedEventOrganizerInfo.website || undefined,
          contactEmail:
            selectedEventOrganizerInfo.contactEmail || selectedEvent.contactEmail,
          contactPhone: selectedEventOrganizerInfo.contactPhone || undefined,
        }
      : {
          organizationName: "Организатор",
          contactEmail: selectedEvent.contactEmail,
        }
    : undefined;

  const organizerOptions: StudentOrganizerOption[] = useMemo(() => {
    const map = new Map<string, { label: string; email: string }>();
    events.forEach((event) => {
      if (!map.has(event.organizerId)) {
        map.set(event.organizerId, {
          label: event.contactEmail || event.organizerId,
          email: event.contactEmail || "",
        });
      }
    });
    return Array.from(map.entries()).map(([id, value]) => ({
      id,
      label: value.label,
      email: value.email,
    }));
  }, [events]);

  const handleOpenStudentEvent = useCallback(
    (id: string, returnView: "home" | "achievements" | "events") => {
      setSelectedEventId(id);
      setStudentEventReturnView(returnView);
      setStudentView("event-details");
    },
    [setStudentView],
  );

  const handleOpenAchievement = useCallback((achievementId: string) => {
    setSelectedAchievementId(achievementId);
  }, []);

  const handleStudentInvitationResponse = useCallback(
    (
      invitationId: string,
      response: "accepted" | "rejected",
    ): string | null => {
      const run = async () => {
        try {
          const updatedInvitation = await respondToStudentInvitation(
            invitationId,
            response,
            currentUser.id,
          );
          setStudentInvitations((prev) =>
            prev.map((item) =>
              item.id === invitationId ? updatedInvitation : item,
            ),
          );
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
      if (nextVisible) {
        currentSet.add(achievementId);
      } else {
        currentSet.delete(achievementId);
      }

      const nextIds = Array.from(currentSet);
      if (nextIds.length > 10) {
        addNotification(
          currentUser.id,
          "Лимит витрины достижений",
          "Можно показать не более 10 достижений в публичной визитке.",
          "system",
        );
        return;
      }

      try {
        const updated = await updateStudentProfile({
          visibleAchievementIds: nextIds,
        });
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
      const currentSet = new Set(
        profile.visibleBadgeIds.filter((id) => unlockedBadgeIds.has(id)),
      );
      if (currentSet.has(badgeId)) {
        currentSet.delete(badgeId);
      } else {
        currentSet.add(badgeId);
      }

      const nextIds = Array.from(currentSet);
      if (nextIds.length > 3) {
        addNotification(
          currentUser.id,
          "Лимит витрины значков",
          "Можно показать не более 3 значков в публичной визитке.",
          "system",
        );
        return;
      }

      try {
        const updated = await updateStudentProfile({
          visibleBadgeIds: nextIds,
        });
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

  const createStudentAchievementSubmit: ComponentProps<
    typeof AchievementRequestForm
  >["onSubmit"] = useCallback(
    (payload) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const achievementDate = new Date(`${payload.date}T00:00:00`);
      if (
        Number.isNaN(achievementDate.getTime()) ||
        achievementDate >= today
      ) {
        addNotification(
          currentUser.id,
          "Ошибка запроса",
          "Достижение можно добавить только за прошедшую дату.",
          "system",
        );
        return;
      }

      const selectedOrganizer = organizerOptions.find(
        (item) => item.id === payload.requestedOrganizerId,
      );

      const descriptionParts: string[] = [];
      if (payload.requestComment?.trim()) {
        descriptionParts.push(payload.requestComment.trim());
      }
      if (payload.eventNotInList && payload.newEvent) {
        descriptionParts.push(
          `Мероприятие вне списка: ${payload.newEvent.title}. ${payload.newEvent.description}`,
        );
        if (payload.newEvent.location) {
          descriptionParts.push(`Локация: ${payload.newEvent.location}`);
        }
        if (payload.newEvent.registrationDeadline) {
          descriptionParts.push(
            `Дедлайн регистрации: ${payload.newEvent.registrationDeadline}`,
          );
        }
        if (payload.newEvent.website) {
          descriptionParts.push(`Сайт: ${payload.newEvent.website}`);
        }
        if (payload.newEvent.contactEmail) {
          descriptionParts.push(`Контакт: ${payload.newEvent.contactEmail}`);
        }
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
            organizerName: payload.eventNotInList
              ? selectedOrganizer?.label || ""
              : undefined,
            description: descriptionParts.join("\n"),
          });

          const refreshed = await fetchStudentAchievements(currentUser.id);
          setAchievements(refreshed);

          const profile = currentUser.publicProfile;
          if (!profile.visibleAchievementIds.includes(created.id)) {
            const nextVisible = [created.id, ...profile.visibleAchievementIds].slice(
              0,
              10,
            );
            const updated = await updateStudentProfile({
              visibleAchievementIds: nextVisible,
            });
            setCurrentUser(updated);
          }

          setStudentView("achievements");
        } catch (error) {
          console.warn("Failed to create achievement.", error);
          addNotification(
            currentUser.id,
            "Ошибка запроса",
            "Не удалось отправить запрос на достижение.",
            "system",
          );
        }
      };

      run();
    },
    [
      addNotification,
      currentUser,
      organizerOptions,
      setAchievements,
      setCurrentUser,
      setStudentView,
    ],
  );

  useEffect(() => {
    if (invitationsLoaded || studentView !== "invitations") return;
    let cancelled = false;
    const loadInvitations = async () => {
      try {
        const invitationsData = await fetchStudentInvitations(currentUser.id);
        if (cancelled) return;
        setStudentInvitations(invitationsData);
        setInvitationsLoaded(true);
      } catch (error) {
        if (!cancelled) {
          setStudentInvitations([]);
        }
      }
    };
    loadInvitations();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id, invitationsLoaded, studentView]);

  useEffect(() => {
    if (
      subscribersLoaded ||
      !["home", "profile", "subscribers", "hr-profile"].includes(studentView)
    ) {
      return;
    }
    let cancelled = false;
    const loadSubscribers = async () => {
      try {
        const subscribersData = await fetchStudentSubscribers();
        if (cancelled) return;
        const normalizedSubscribers = subscribersData.reduce<
          SubscriberPreviewItem[]
        >((acc, item) => {
          const firstName = item.firstName ?? "";
          const lastName = item.lastName ?? "";
          const name =
            [lastName, firstName].filter(Boolean).join(" ").trim() ||
            item.companyName ||
            item.email ||
            "HR";
          const id = item.hrId ?? item.id ?? item.email ?? "";
          if (!id) return acc;
          acc.push({ id, name, email: item.email ?? "" });
          return acc;
        }, []);
        setStudentSubscribers(normalizedSubscribers);
        setSubscribersLoaded(true);
      } catch (error) {
        if (!cancelled) {
          setStudentSubscribers([]);
        }
      }
    };
    loadSubscribers();
    return () => {
      cancelled = true;
    };
  }, [subscribersLoaded, studentView]);

  useEffect(() => {
    if (!selectedHrProfileId) {
      setSelectedHrProfileUser(null);
      return;
    }
    let cancelled = false;
    const loadProfile = async () => {
      try {
        const profile = await fetchPublicHrProfile(selectedHrProfileId);
        if (!cancelled) {
          setSelectedHrProfileUser(profile);
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedHrProfileUser(null);
        }
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [selectedHrProfileId]);

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

  useEffect(() => {
    if (visibilitySeededForUserId === currentUser.id) return;
    const profile = currentUser.publicProfile;
    if (profile.visibleAchievementIds.length > 0 || studentAchievements.length === 0) {
      setVisibilitySeededForUserId(currentUser.id);
      return;
    }

    const run = async () => {
      try {
        const updated = await updateStudentProfile({
          visibleAchievementIds: studentAchievements
            .slice(0, 10)
            .map((item) => item.id),
        });
        setCurrentUser(updated);
        setVisibilitySeededForUserId(currentUser.id);
      } catch (error) {
        console.warn("Failed to seed visible achievements.", error);
      }
    };
    run();
  }, [
    currentUser,
    setCurrentUser,
    studentAchievements,
    visibilitySeededForUserId,
  ]);

  useEffect(() => {
    const currentIds = currentUser.publicProfile.visibleBadgeIds;
    const normalizedIds = Array.from(new Set(currentIds)).filter((id) =>
      unlockedBadgeIds.has(id),
    );
    const isSameLength = normalizedIds.length === currentIds.length;
    const isSameContent =
      isSameLength &&
      normalizedIds.every((id, index) => id === currentIds[index]);
    if (isSameContent) return;

    const run = async () => {
      try {
        const updated = await updateStudentProfile({
          visibleBadgeIds: normalizedIds,
        });
        setCurrentUser(updated);
      } catch (error) {
        console.warn("Failed to normalize visible badges.", error);
      }
    };
    run();
  }, [currentUser, setCurrentUser, unlockedBadgeIds]);

  const visibleBadgeIds = useMemo(
    () =>
      currentUser.publicProfile.visibleBadgeIds.filter((id) =>
        unlockedBadgeIds.has(id),
      ),
    [currentUser.publicProfile.visibleBadgeIds, unlockedBadgeIds],
  );

  return (
    <>
      {studentView === "home" && (
        <StudentHomeSection
          achievements={studentAchievements}
          recommendedEvents={recommendedStudentEvents}
          user={currentUser}
          subscribers={studentSubscribers}
          onOpenSubscribers={() => {
            setSelectedHrProfileId(null);
            setStudentSubscribersReturnView("home");
            setStudentView("subscribers");
          }}
          onOpenEvent={(eventId) => handleOpenStudentEvent(eventId, "home")}
          onOpenAchievement={handleOpenAchievement}
          onOpenRecommendedEvents={() => {
            setStudentEventsTab("recommended");
            setStudentView("events");
          }}
        />
      )}
      {studentView === "events" && (
        <StudentEventsSection
          events={availableStudentEvents}
          recommendedEvents={recommendedStudentEvents}
          activeTab={studentEventsTab}
          onTabChange={setStudentEventsTab}
          filtersState={studentEventsFilters}
          onFiltersStateChange={setStudentEventsFilters}
          onOpenEvent={(eventId) => handleOpenStudentEvent(eventId, "events")}
        />
      )}
      {studentView === "dashboards" && (
        <StudentDashboardsSection achievements={studentAchievements} />
      )}
      {studentView === "achievements" && (
        <StudentAchievementsSection
          achievements={studentAchievements}
          events={events}
          onOpenEvent={(eventId) => handleOpenStudentEvent(eventId, "achievements")}
          onOpenAchievement={handleOpenAchievement}
          onCreateAchievement={() => setStudentView("create-achievement")}
          achievementNotifications={studentAchievementNotifications}
          visibleBadgeIds={visibleBadgeIds}
          onToggleBadgeVisibility={handleToggleBadgeVisibility}
        />
      )}
      {studentView === "invitations" && (
        <StudentInvitationsSection
          invitations={studentInvitations}
          onRespond={handleStudentInvitationResponse}
        />
      )}
      {studentView === "create-achievement" && (
        <StudentCreateAchievementSection
          organizerOptions={organizerOptions}
          events={events}
          onBack={() => setStudentView("achievements")}
          onSubmit={createStudentAchievementSubmit}
        />
      )}
      {studentView === "event-details" && selectedEvent && (
        <StudentEventDetailsSection
          event={selectedEvent}
          organizerInfo={eventOrganizerInfo}
          applications={selectedEventApplications}
          isApplied={isCurrentStudentApplied}
          onToggleApplication={() => handleToggleApplication(selectedEvent.id)}
          onBack={() => {
            setSelectedEventId(null);
            setStudentView(studentEventReturnView);
          }}
        />
      )}
      {studentView === "profile" && (
        <StudentProfileSection
          user={currentUser}
          achievements={studentAchievements}
          badges={studentBadges}
          subscribers={studentSubscribers}
          onOpenSubscribers={() => {
            setSelectedHrProfileId(null);
            setStudentSubscribersReturnView("profile");
            setStudentView("subscribers");
          }}
          setCurrentUser={setCurrentUser}
          publicStats={publicStats}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      {studentView === "subscribers" && (
        <StudentSubscribersSection
          subscribers={studentSubscribers}
          onBack={() => setStudentView(studentSubscribersReturnView)}
          onOpenSubscriber={(hrId) => {
            setSelectedHrProfileId(hrId);
            setStudentView("hr-profile");
          }}
        />
      )}
      {studentView === "hr-profile" && (
        <StudentHrProfileSection
          hrUser={selectedHrProfileUser}
          onBack={() => setStudentView("subscribers")}
        />
      )}
      <AchievementDetailsModal
        achievement={selectedAchievement}
        event={selectedAchievementEvent}
        isVisibleInPublic={
          selectedAchievement
            ? currentUser.publicProfile.visibleAchievementIds.includes(
                selectedAchievement.id,
              )
            : false
        }
        onToggleVisible={(nextValue) => {
          if (!selectedAchievement) return;
          handleToggleAchievementVisibility(selectedAchievement.id, nextValue);
        }}
        onClose={() => setSelectedAchievementId(null)}
        onOpenEvent={(eventId) => {
          handleOpenStudentEvent(eventId, "achievements");
          setSelectedAchievementId(null);
        }}
      />
    </>
  );
}
