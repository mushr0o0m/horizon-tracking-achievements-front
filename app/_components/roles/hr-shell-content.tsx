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
import { usePathname, useRouter } from "next/navigation";
import { HrHomePage, type HrHomeTopAchievementCandidate, type HrHomeTopSubscriberCandidate } from "@/components/hr/hr-home-page";
import { HrDashboardsPage } from "@/components/hr/hr-dashboards-page";
import { HrCandidatesSearchPage, type HrCandidateSummary, type HrCandidatesSearchFiltersState } from "@/components/hr/hr-candidates-search-page";
import { HrCandidateProfilePage, type HrInvitationPayload } from "@/components/hr/hr-candidate-profile-page";
import { SubscribersPage } from "@/components/shared/subscribers-page";
import { HrPublicProfilePage } from "@/components/hr/hr-public-profile-page";
import { EventDetailsPage } from "@/components/shared/event-details-page";
import { OrganizerProfilePage } from "@/components/organizer/organizer-profile-page";
import type {
  Achievement,
  AuthUser,
  Event,
  HrView,
  EventApplication,
} from "@/lib/types";
import type { HrActionConfirmSettings } from "@/lib/hr-network";
import { HR_FUNNEL_STATUSES, type HrFunnelStatus, type HrStatusHistoryEntry } from "@/lib/hr-funnel";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import { canMoveHrCandidateStatus, isHrKanbanStatus } from "@/app/shared/hr/status";
import { HR_SORT_COLUMNS, HR_SORT_DIRECTIONS } from "@/app/shared/hr/filters";
import {
  archiveHrCandidate,
  createHrCandidateInvitation,
  fetchHrCandidateDetails,
  fetchHrCandidatesSearch,
  fetchHrHome,
  fetchHrSettings,
  fetchNotifications,
  fetchPublicEvents,
  fetchPublicHrProfile,
  toggleHrCandidateSubscriptionApi,
  updateHrCandidateNote,
  updateHrCandidateStatus,
  updateHrSettings,
} from "@/lib/backend-api";
import { useEventsStore } from "@/stores/events-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { buildPathForCurrentView } from "@/app/shared/routing/app-shell-routes";

type HrCandidateBackView = "home" | "dashboards" | "candidates-search";

interface SelectedHrCandidateData {
  candidate: AuthUser | null;
  achievements: Achievement[];
  status: HrFunnelStatus;
  statusHistory: HrStatusHistoryEntry[];
  note: string;
  subscribers: SubscriberPreviewItem[];
  isCurrentHrSubscribed: boolean;
}

let cachedSelectedHrCandidateData: SelectedHrCandidateData | null = null;
let cachedSelectedHrCandidateId: string | null = null;
let cachedHrCandidateBackView: HrCandidateBackView = "candidates-search";

interface HrShellContentProps {
  currentUser: AuthUser;
  hrView: HrView;
  setHrView: (view: HrView) => void;
  setCurrentUser: Dispatch<SetStateAction<AuthUser | null>>;
  handleMarkNotificationRead: (notificationId: string) => void;
  handleMarkAllNotificationsRead: () => void;
  hrCandidatesSearchFilters: HrCandidatesSearchFiltersState;
  setHrCandidatesSearchFilters: (next: HrCandidatesSearchFiltersState) => void;
  handleChangePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  handleDeleteAccount: (confirmationText: string) => string | null;
}

export function HrShellContent({
  currentUser,
  hrView,
  setHrView,
  setCurrentUser,
  handleMarkNotificationRead,
  handleMarkAllNotificationsRead,
  hrCandidatesSearchFilters,
  setHrCandidatesSearchFilters,
  handleChangePassword,
  handleDeleteAccount,
}: HrShellContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { events, setEvents } = useEventsStore();
  const { notifications, setNotifications } = useNotificationsStore();
  const [hrHomeSummary, setHrHomeSummary] = useState<{
    topByAchievements: HrHomeTopAchievementCandidate[];
    topBySubscribers: HrHomeTopSubscriberCandidate[];
  }>({ topByAchievements: [], topBySubscribers: [] });
  const [hrCandidates, setHrCandidates] = useState<HrCandidateSummary[]>([]);
  const [selectedHrCandidateData, setSelectedHrCandidateData] =
    useState<SelectedHrCandidateData | null>(() => cachedSelectedHrCandidateData);
  const [selectedHrCandidateId, setSelectedHrCandidateId] = useState<
    string | null
  >(() => cachedSelectedHrCandidateId);
  const [selectedHrProfileId, setSelectedHrProfileId] = useState<string | null>(
    null,
  );
  const [selectedHrProfileUser, setSelectedHrProfileUser] =
    useState<AuthUser | null>(null);
  const [hrCandidateBackView, setHrCandidateBackView] =
    useState<HrCandidateBackView>(() => cachedHrCandidateBackView);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [hrDefaultInviteComment, setHrDefaultInviteCommentState] = useState("");
  const [hrActionConfirmSettings, setHrActionConfirmSettingsState] =
    useState<HrActionConfirmSettings>({
      confirmReject: true,
      confirmArchive: true,
    });
  const [eventsLoaded, setEventsLoaded] = useState(false);

  useEffect(() => {
    const nextPath = buildPathForCurrentView({
      role: "hr",
      studentView: "home",
      organizerView: "events",
      hrView,
      studentEventsTab: "table",
    });
    const nextParams = new URLSearchParams();
    if (hrView === "candidates-search") {
      if (hrCandidatesSearchFilters.query.trim()) {
        nextParams.set("query", hrCandidatesSearchFilters.query.trim());
      }
      if (hrCandidatesSearchFilters.selectedUniversity !== "all") {
        nextParams.set("university", hrCandidatesSearchFilters.selectedUniversity);
      }
      if (hrCandidatesSearchFilters.selectedStatuses.length > 0) {
        nextParams.set(
          "statuses",
          hrCandidatesSearchFilters.selectedStatuses.join(","),
        );
      }
      if (hrCandidatesSearchFilters.sortState) {
        nextParams.set("sortColumn", hrCandidatesSearchFilters.sortState.column);
        nextParams.set(
          "sortDirection",
          hrCandidatesSearchFilters.sortState.direction,
        );
      }
      if (hrCandidatesSearchFilters.page > 1) {
        nextParams.set("page", String(hrCandidatesSearchFilters.page));
      }
    }
    const nextUrl = `${nextPath}${
      nextParams.toString() ? `?${nextParams.toString()}` : ""
    }`;
    const currentUrl = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [hrCandidatesSearchFilters, hrView, pathname, router]);

  const hrPublishedEventsCount = useMemo(
    () => events.filter((item) => item.status === "published").length,
    [events],
  );
  const hrTopByAchievements = useMemo(
    () => hrHomeSummary.topByAchievements,
    [hrHomeSummary],
  );
  const hrTopBySubscribers = useMemo(
    () => hrHomeSummary.topBySubscribers,
    [hrHomeSummary],
  );
  const hrHomeNotifications = useMemo(
    () =>
      [...notifications]
        .filter((item) => item.userId === currentUser.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8),
    [currentUser.id, notifications],
  );
  const selectedHrCandidate = selectedHrCandidateData?.candidate ?? null;
  const selectedHrCandidateAchievements =
    selectedHrCandidateData?.achievements ?? [];
  const selectedHrCandidateStatus =
    selectedHrCandidateData?.status ?? "Не отслеживается";
  const selectedHrCandidateStatusHistory =
    selectedHrCandidateData?.statusHistory ?? [];
  const selectedHrCandidateNote = selectedHrCandidateData?.note ?? "";
  const selectedHrCandidateSubscribers =
    selectedHrCandidateData?.subscribers ?? [];
  const isSelectedCandidateSubscribedByCurrentHr =
    selectedHrCandidateData?.isCurrentHrSubscribed ?? false;

  const selectedHrCandidateEvents = useMemo(() => {
    if (!selectedHrCandidate) return [];
    const eventIds = Array.from(
      new Set(
        selectedHrCandidateAchievements
          .map((achievement) => achievement.eventId)
          .filter((eventId): eventId is string => Boolean(eventId)),
      ),
    );
    return eventIds
      .map((eventId) => events.find((event) => event.id === eventId) ?? null)
      .filter((event): event is Event => event !== null);
  }, [events, selectedHrCandidate, selectedHrCandidateAchievements]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId],
  );
  const selectedEventApplications: EventApplication[] = [];
  const eventOrganizerInfo: ComponentProps<typeof EventDetailsPage>["organizerInfo"] =
    selectedEvent
      ? {
          organizationName: "Организатор",
          contactEmail: selectedEvent.contactEmail,
        }
      : undefined;
  const organizerComputedStats = useMemo(
    () => ({
      eventsCount: events.length,
      totalParticipants: events.reduce(
        (sum, event) => sum + event.participantsCount,
        0,
      ),
    }),
    [events],
  );

  const getCandidateStatusById = useCallback(
    (candidateId: string): HrFunnelStatus => {
      const candidate = hrCandidates.find((item) => item.id === candidateId);
      return (
        candidate?.candidateStatus ??
        selectedHrCandidateData?.status ??
        "Не отслеживается"
      );
    },
    [hrCandidates, selectedHrCandidateData],
  );

  const updateCandidateStatusState = useCallback(
    (candidateId: string, status: HrFunnelStatus) => {
      setHrCandidates((prev) =>
        prev.map((candidate) =>
          candidate.id === candidateId
            ? { ...candidate, candidateStatus: status }
            : candidate,
        ),
      );
      setSelectedHrCandidateData((prev) =>
        prev && prev.candidate?.id === candidateId ? { ...prev, status } : prev,
      );
    },
    [],
  );

  const handleMoveHrCandidateStatus = useCallback(
    (
      candidateId: string,
      toStatus: HrFunnelStatus,
      note?: string,
    ): string | null => {
      const currentStatus = getCandidateStatusById(candidateId);
      if (currentStatus === toStatus) return null;
      if (!canMoveHrCandidateStatus(currentStatus, toStatus)) {
        return `Переход из «${currentStatus}» в «${toStatus}» запрещен.`;
      }
      const run = async () => {
        try {
          await updateHrCandidateStatus(candidateId, toStatus, note);
          updateCandidateStatusState(candidateId, toStatus);
        } catch (error) {
          console.warn("Failed to update HR candidate status.", error);
        }
      };
      run();
      return null;
    },
    [getCandidateStatusById, updateCandidateStatusState],
  );

  const handleAddCandidateToFunnel = (candidateId: string): string | null => {
    const currentStatus = getCandidateStatusById(candidateId);
    if (isHrKanbanStatus(currentStatus)) {
      return "Кандидат уже находится в воронке.";
    }
    const run = async () => {
      try {
        await updateHrCandidateStatus(
          candidateId,
          "На рассмотрении",
          "Кандидат добавлен в воронку",
        );
        updateCandidateStatusState(candidateId, "На рассмотрении");
      } catch (error) {
        console.warn("Failed to add candidate to funnel.", error);
      }
    };
    run();
    return null;
  };

  const handleArchiveHrCandidate = (candidateId: string): string | null => {
    const currentStatus = getCandidateStatusById(candidateId);
    if (!isHrKanbanStatus(currentStatus)) {
      return "В архив можно перемещать только кандидатов из воронки.";
    }
    const run = async () => {
      try {
        await archiveHrCandidate(
          candidateId,
          "Кандидат добавлен в архив вручную",
        );
        updateCandidateStatusState(candidateId, "Отклонён");
      } catch (error) {
        console.warn("Failed to archive HR candidate.", error);
      }
    };
    run();
    return null;
  };

  const handleInviteHrCandidate = (
    candidateId: string,
    payload: HrInvitationPayload,
  ): string | null => {
    const candidate = hrCandidates.find((item) => item.id === candidateId) ?? null;
    if (!candidate) return "Кандидат не выбран.";
    if (!payload.message.trim()) return "Комментарий к приглашению обязателен.";
    const currentStatus = getCandidateStatusById(candidate.id);
    if (!canMoveHrCandidateStatus(currentStatus, "Приглашён")) {
      return `Переход из «${currentStatus}» в «Приглашён» запрещен.`;
    }

    const scheduleText = payload.sendNow
      ? "Отправка сразу"
      : payload.scheduledAt
        ? `Плановая отправка: ${new Date(payload.scheduledAt).toLocaleDateString("ru-RU")}`
        : "Плановая отправка";
    const inviteNote = `Приглашение на позицию «${payload.position}». ${scheduleText}${payload.message ? `. Сообщение: ${payload.message}` : ""}`;
    const moveError = handleMoveHrCandidateStatus(
      candidate.id,
      "Приглашён",
      inviteNote,
    );
    if (moveError) return moveError;

    const run = async () => {
      try {
        await createHrCandidateInvitation(candidate.id, {
          position: payload.position,
          message: payload.message,
          sendNow: payload.sendNow,
          scheduledAt: payload.scheduledAt,
        });
      } catch (error) {
        console.warn("Failed to create HR invitation.", error);
      }
    };
    run();
    return null;
  };

  const handleSaveHrCandidateNote = async (note: string) => {
    if (!selectedHrCandidate) return;
    try {
      await updateHrCandidateNote(selectedHrCandidate.id, note);
      setSelectedHrCandidateData((prev) =>
        prev
          ? {
              ...prev,
              note,
            }
          : prev,
      );
    } catch (error) {
      console.warn("Failed to update HR note.", error);
    }
  };

  const handleToggleHrCandidateSubscription = () => {
    if (!selectedHrCandidate) return;
    const run = async () => {
      try {
        const result = await toggleHrCandidateSubscriptionApi(
          selectedHrCandidate.id,
        );
        setSelectedHrCandidateData((prev) =>
          prev
            ? {
                ...prev,
                isCurrentHrSubscribed: result.isSubscribed,
              }
            : prev,
        );
      } catch (error) {
        console.warn("Failed to toggle HR subscription.", error);
      }
    };
    run();
  };

  const handleOpenHrEvent = (id: string) => {
    setSelectedEventId(id);
    setHrView("event-details");
  };

  const loadHrCandidateProfile = useCallback(
    async (candidateId: string): Promise<SelectedHrCandidateData | null> => {
      try {
        const details = await fetchHrCandidateDetails(candidateId);
        const subscribers = details.subscribers.reduce<SubscriberPreviewItem[]>(
          (acc, item) => {
            const firstName = item.firstName ?? "";
            const lastName = item.lastName ?? "";
            const name =
              [lastName, firstName].filter(Boolean).join(" ").trim() ||
              item.companyName ||
              item.email ||
              "HR";
            const id = item.hrId ?? item.id ?? item.email ?? "";
            if (!id) return acc;
            acc.push({
              id,
              name,
              email: item.email ?? "",
            });
            return acc;
          },
          [],
        );
        return {
          candidate: details.candidate,
          achievements: details.achievements,
          status: details.status,
          statusHistory: details.statusHistory,
          note: details.note,
          subscribers,
          isCurrentHrSubscribed: subscribers.some(
            (item) => item.id === currentUser.id,
          ),
        };
      } catch (error) {
        console.warn("Failed to load HR candidate details.", error);
        return null;
      }
    },
    [currentUser.id],
  );

  const handleOpenHrCandidateProfile = useCallback(
    (candidateId: string, backView: HrCandidateBackView) => {
      setSelectedHrCandidateId(candidateId);
      setSelectedHrProfileId(null);
      setHrCandidateBackView(backView);
      setHrView("candidate-profile");
      const run = async () => {
        const loaded = await loadHrCandidateProfile(candidateId);
        if (!loaded) {
          setSelectedHrCandidateData(null);
          return;
        }
        setSelectedHrCandidateData(loaded);
      };
      run();
    },
    [loadHrCandidateProfile, setHrView],
  );

  useEffect(() => {
    cachedSelectedHrCandidateData = selectedHrCandidateData;
  }, [selectedHrCandidateData]);

  useEffect(() => {
    cachedSelectedHrCandidateId = selectedHrCandidateId;
  }, [selectedHrCandidateId]);

  useEffect(() => {
    cachedHrCandidateBackView = hrCandidateBackView;
  }, [hrCandidateBackView]);

  useEffect(() => {
    if (hrView !== "candidate-profile") return;
    if (!selectedHrCandidateId) return;
    if (selectedHrCandidateData?.candidate?.id === selectedHrCandidateId) return;
    let cancelled = false;
    const run = async () => {
      const loaded = await loadHrCandidateProfile(selectedHrCandidateId);
      if (cancelled) return;
      setSelectedHrCandidateData(loaded);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [
    hrView,
    loadHrCandidateProfile,
    selectedHrCandidateData?.candidate?.id,
    selectedHrCandidateId,
  ]);

  const handleUpdateHrDefaultInviteComment = async (comment: string) => {
    try {
      const updated = await updateHrSettings({ defaultInviteComment: comment });
      setHrDefaultInviteCommentState(updated.defaultInviteComment);
    } catch (error) {
      console.warn("Failed to update HR settings.", error);
    }
  };

  const handleUpdateHrActionConfirmSettings = async (
    settings: HrActionConfirmSettings,
  ) => {
    try {
      const updated = await updateHrSettings({
        confirmRejectAction: settings.confirmReject,
        confirmArchiveAction: settings.confirmArchive,
      });
      setHrActionConfirmSettingsState({
        confirmReject: updated.confirmRejectAction,
        confirmArchive: updated.confirmArchiveAction,
      });
    } catch (error) {
      console.warn("Failed to update HR settings.", error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const loadHrData = async () => {
      try {
        const [hrHomeData, hrCandidatesData] = await Promise.all([
          fetchHrHome(),
          fetchHrCandidatesSearch(),
        ]);
        if (cancelled) return;
        setHrHomeSummary({
          topByAchievements: hrHomeData.topByAchievements,
          topBySubscribers: hrHomeData.topBySubscribers,
        });
        setHrCandidates(
          hrCandidatesData.map((candidate) => ({
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            university: candidate.university,
            faculty: candidate.faculty,
            course: candidate.course,
            totalAchievementsCount: candidate.totalAchievementsCount,
            confirmedAchievementsCount: candidate.confirmedAchievementsCount,
            candidateStatus: candidate.candidateStatus,
          })),
        );
      } catch (error) {
        if (!cancelled) {
          setHrHomeSummary({ topByAchievements: [], topBySubscribers: [] });
          setHrCandidates([]);
        }
      }
    };
    loadHrData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (
      eventsLoaded ||
      !["event-details", "profile", "candidate-profile", "dashboards", "home"].includes(
        hrView,
      )
    ) {
      return;
    }
    let cancelled = false;
    const loadEvents = async () => {
      try {
        const eventsData = await fetchPublicEvents();
        if (!cancelled) {
          setEvents(eventsData);
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
  }, [eventsLoaded, hrView, setEvents]);

  useEffect(() => {
    let cancelled = false;
    const loadSettings = async () => {
      try {
        const settings = await fetchHrSettings();
        if (cancelled) return;
        setHrDefaultInviteCommentState(settings.defaultInviteComment);
        setHrActionConfirmSettingsState({
          confirmReject: settings.confirmRejectAction,
          confirmArchive: settings.confirmArchiveAction,
        });
      } catch (error) {
        if (!cancelled) {
          setHrDefaultInviteCommentState("");
          setHrActionConfirmSettingsState({
            confirmReject: true,
            confirmArchive: true,
          });
        }
      }
    };
    loadSettings();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (hrView !== "candidates-search") return;
    const selectedStatusesRaw = hrCandidatesSearchFilters.selectedStatuses;
    const selectedStatuses = selectedStatusesRaw
      .filter((status): status is HrFunnelStatus =>
        HR_FUNNEL_STATUSES.includes(status as HrFunnelStatus),
      );
    if (selectedStatuses.length === selectedStatusesRaw.length) return;
    setHrCandidatesSearchFilters({
      ...hrCandidatesSearchFilters,
      selectedStatuses,
    });
  }, [hrCandidatesSearchFilters, hrView, setHrCandidatesSearchFilters]);

  useEffect(() => {
    if (hrView !== "candidates-search") return;
    if (!hrCandidatesSearchFilters.sortState) return;
    const { column, direction } = hrCandidatesSearchFilters.sortState;
    if (
      HR_SORT_COLUMNS.includes(column) &&
      HR_SORT_DIRECTIONS.includes(direction)
    ) {
      return;
    }
    setHrCandidatesSearchFilters({
      ...hrCandidatesSearchFilters,
      sortState: null,
    });
  }, [hrCandidatesSearchFilters, hrView, setHrCandidatesSearchFilters]);

  useEffect(() => {
    let cancelled = false;
    const refreshNotifications = async () => {
      try {
        const refreshed = await fetchNotifications(currentUser.id);
        if (!cancelled) {
          setNotifications(refreshed);
        }
      } catch (error) {
        // Keep current state
      }
    };
    refreshNotifications();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id, setNotifications]);

  return (
    <>
      {hrView === "home" && (
        <HrHomePage
          topByAchievements={hrTopByAchievements}
          topBySubscribers={hrTopBySubscribers}
          notifications={hrHomeNotifications}
          onOpenCandidate={(candidateId) =>
            handleOpenHrCandidateProfile(candidateId, "home")
          }
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        />
      )}

      {hrView === "dashboards" && (
        <HrDashboardsPage
          hrId={currentUser.id}
          publishedEventsCount={hrPublishedEventsCount}
          defaultInviteComment={hrDefaultInviteComment}
          actionConfirmSettings={hrActionConfirmSettings}
          onSaveCandidateNote={handleSaveHrCandidateNote}
          onOpenCandidate={(candidateId) =>
            handleOpenHrCandidateProfile(candidateId, "dashboards")
          }
          onChangeCandidateStatus={(candidateId, toStatus) =>
            handleMoveHrCandidateStatus(
              candidateId,
              toStatus,
              "Статус изменен на дашборде",
            )
          }
          onInviteCandidate={(candidateId, payload) =>
            handleInviteHrCandidate(candidateId, payload)
          }
          onArchiveCandidate={(candidateId) => handleArchiveHrCandidate(candidateId)}
        />
      )}

      {hrView === "candidates-search" && (
        <HrCandidatesSearchPage
          candidates={hrCandidates}
          filtersState={hrCandidatesSearchFilters}
          onFiltersStateChange={setHrCandidatesSearchFilters}
          onAddToFunnel={(candidateId) => handleAddCandidateToFunnel(candidateId)}
          onOpenCandidate={(candidateId) =>
            handleOpenHrCandidateProfile(candidateId, "candidates-search")
          }
        />
      )}

      {hrView === "candidate-profile" && (
        <HrCandidateProfilePage
          candidate={selectedHrCandidate}
          achievements={selectedHrCandidateAchievements}
          events={selectedHrCandidateEvents}
          candidateStatus={selectedHrCandidateStatus}
          statusHistory={selectedHrCandidateStatusHistory}
          savedNote={selectedHrCandidateNote}
          defaultInviteComment={hrDefaultInviteComment}
          subscribers={selectedHrCandidateSubscribers}
          isCurrentHrSubscribed={isSelectedCandidateSubscribedByCurrentHr}
          onBackToPreviousPage={() => {
            setSelectedHrProfileId(null);
            setHrView(hrCandidateBackView);
          }}
          onOpenEvent={handleOpenHrEvent}
          onSaveNote={handleSaveHrCandidateNote}
          onInvite={(payload) =>
            selectedHrCandidate
              ? handleInviteHrCandidate(selectedHrCandidate.id, payload)
              : "Кандидат не выбран."
          }
          onToggleSubscription={handleToggleHrCandidateSubscription}
          onOpenSubscribers={() => setHrView("candidate-subscribers")}
          onAddToFunnel={() =>
            selectedHrCandidate
              ? handleAddCandidateToFunnel(selectedHrCandidate.id)
              : null
          }
        />
      )}

      {hrView === "candidate-subscribers" && (
        <SubscribersPage
          title={
            selectedHrCandidate
              ? `Подписчики: ${selectedHrCandidate.name}`
              : "Подписчики кандидата"
          }
          subtitle="HR, которые следят за обновлениями этого кандидата"
          subscribers={selectedHrCandidateSubscribers}
          onBack={() => setHrView("candidate-profile")}
          onOpenSubscriber={(hrId) => {
            setSelectedHrProfileId(hrId);
            setHrView("subscriber-profile");
          }}
        />
      )}

      {hrView === "subscriber-profile" && (
        <HrPublicProfilePage
          hrUser={selectedHrProfileUser}
          onBack={() => setHrView("candidate-subscribers")}
        />
      )}

      {hrView === "event-details" && selectedEvent && (
        <EventDetailsPage
          event={selectedEvent}
          organizerInfo={eventOrganizerInfo}
          role="hr"
          applications={selectedEventApplications}
          onBack={() => {
            setSelectedEventId(null);
            setHrView(
              selectedHrCandidateId ? "candidate-profile" : "candidates-search",
            );
          }}
        />
      )}

      {hrView === "profile" && (
        <OrganizerProfilePage
          user={currentUser}
          organizationStats={organizerComputedStats}
          setCurrentUser={setCurrentUser}
          onChangePassword={handleChangePassword}
          hrDefaultInviteComment={hrDefaultInviteComment}
          hrActionConfirmSettings={hrActionConfirmSettings}
          onUpdateHrDefaultInviteComment={handleUpdateHrDefaultInviteComment}
          onUpdateHrActionConfirmSettings={handleUpdateHrActionConfirmSettings}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
    </>
  );
}
