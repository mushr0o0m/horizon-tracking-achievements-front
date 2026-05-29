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
import type {
  HrHomeTopAchievementCandidate,
  HrHomeTopSubscriberCandidate,
  HrTalentFeedComparison,
} from "@/components/hr/hr-home-page";
import { EventDetailsPage } from "@/components/shared/event-details-page";
import type {
  Achievement,
  AuthUser,
  Event,
  EventApplication,
  HrView,
} from "@/lib/types";
import type { HrActionConfirmSettings } from "@/lib/hr-network";
import { HR_FUNNEL_STATUSES, type HrFunnelStatus, type HrStatusHistoryEntry } from "@/lib/hr-funnel";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import type { HrInvitationPayload } from "@/components/hr/hr-candidate-profile-page";
import type { HrCandidateSummary, HrCandidatesSearchFiltersState } from "@/components/hr/hr-candidates-search-page";
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
import {
  buildHrDashboardsPath,
  buildHrProfilePath,
  buildHrCandidateProfilePath,
  buildPathForCurrentView,
  resolveHrDashboardsTab,
  resolveHrProfileTab,
  type HrDashboardTab,
  type HrProfileTab,
} from "@/app/shared/routing/app-shell-routes";

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

export interface HrShellRuntimeProps {
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

export function useHrShellRuntime({
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
}: HrShellRuntimeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isApplyingUrlStateRef = useRef(false);
  const { events, setEvents } = useEventsStore();
  const { notifications, setNotifications } = useNotificationsStore();
  const [hrHomeSummary, setHrHomeSummary] = useState<{
    topByAchievements: HrHomeTopAchievementCandidate[];
    topBySubscribers: HrHomeTopSubscriberCandidate[];
  }>({ topByAchievements: [], topBySubscribers: [] });
  const [hrTalentFeedComparison, setHrTalentFeedComparison] =
    useState<HrTalentFeedComparison | null>(null);
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
  const [hrDashboardTab, setHrDashboardTab] = useState<HrDashboardTab>(() => {
    return resolveHrDashboardsTab(pathname);
  });
  const [hrProfileTab, setHrProfileTab] = useState<HrProfileTab>(() => {
    return resolveHrProfileTab(pathname);
  });
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [isHrCandidatesSearchLoading, setIsHrCandidatesSearchLoading] =
    useState(true);
  const [isHrCandidateProfileLoading, setIsHrCandidateProfileLoading] =
    useState(false);

  useEffect(() => {
    const pathParts = pathname.split("/").filter(Boolean);
    if (pathParts[0] !== "hr") return;

    isApplyingUrlStateRef.current = true;
    if (pathParts[1] === "candidate-profile") {
      setSelectedHrCandidateId(
        pathParts[2] && pathParts[2] !== "main" ? pathParts[2] : searchParams.get("candidateId"),
      );
    }
    if (pathParts[1] === "profile") {
      setHrProfileTab(resolveHrProfileTab(pathname));
    }
    if (pathParts[1] === "dashboards") {
      setHrDashboardTab(resolveHrDashboardsTab(pathname));
    }
    queueMicrotask(() => {
      isApplyingUrlStateRef.current = false;
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    if (isApplyingUrlStateRef.current) return;
    const nextPath = buildPathForCurrentView({
      role: "hr",
      studentView: "home",
      organizerView: "events",
      hrView,
      studentEventsTab: "table",
    });
    const nextParams = new URLSearchParams();
    let resolvedPath = nextPath;
    if (hrView === "candidate-profile" && selectedHrCandidateId) {
      resolvedPath = buildHrCandidateProfilePath(selectedHrCandidateId);
    } else if (hrView === "dashboards") {
      resolvedPath = buildHrDashboardsPath(hrDashboardTab);
    } else if (hrView === "profile") {
      resolvedPath = buildHrProfilePath(hrProfileTab);
    }
    const nextUrl = `${resolvedPath}${
      nextParams.toString() ? `?${nextParams.toString()}` : ""
    }`;
    const currentUrl = `${pathname}${
      searchParams.toString() ? `?${searchParams.toString()}` : ""
    }`;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    hrView,
    pathname,
    router,
    searchParams,
    selectedHrCandidateId,
    hrDashboardTab,
    hrProfileTab,
  ]);

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
    async (
      candidateId: string,
      toStatus: HrFunnelStatus,
      note?: string,
    ): Promise<string | null> => {
      const currentStatus = getCandidateStatusById(candidateId);
      if (currentStatus === toStatus) return null;
      if (!canMoveHrCandidateStatus(currentStatus, toStatus)) {
        return `Переход из «${currentStatus}» в «${toStatus}» запрещен.`;
      }
      try {
        await updateHrCandidateStatus(candidateId, toStatus, note);
        updateCandidateStatusState(candidateId, toStatus);
        return null;
      } catch (error) {
        console.warn("Failed to update HR candidate status.", error);
        return "Не удалось обновить статус кандидата.";
      }
    },
    [getCandidateStatusById, updateCandidateStatusState],
  );

  const handleAddCandidateToFunnel = async (
    candidateId: string,
  ): Promise<string | null> => {
    const currentStatus = getCandidateStatusById(candidateId);
    if (isHrKanbanStatus(currentStatus)) {
      return "Кандидат уже находится в воронке.";
    }
    try {
      await updateHrCandidateStatus(
        candidateId,
        "На рассмотрении",
        "Кандидат добавлен в воронку",
      );
      updateCandidateStatusState(candidateId, "На рассмотрении");
      return null;
    } catch (error) {
      console.warn("Failed to add candidate to funnel.", error);
      return "Не удалось добавить кандидата в воронку.";
    }
  };

  const handleArchiveHrCandidate = async (
    candidateId: string,
  ): Promise<string | null> => {
    const currentStatus = getCandidateStatusById(candidateId);
    if (!isHrKanbanStatus(currentStatus)) {
      return "В архив можно перемещать только кандидатов из воронки.";
    }
    try {
      await archiveHrCandidate(
        candidateId,
        "Кандидат добавлен в архив вручную",
      );
      updateCandidateStatusState(candidateId, "Отклонён");
      return null;
    } catch (error) {
      console.warn("Failed to archive HR candidate.", error);
      return "Не удалось переместить кандидата в архив.";
    }
  };

  const handleInviteHrCandidate = async (
    candidateId: string,
    payload: HrInvitationPayload,
  ): Promise<string | null> => {
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
    const moveError = await handleMoveHrCandidateStatus(
      candidate.id,
      "Приглашён",
      inviteNote,
    );
    if (moveError) return moveError;
    try {
      await createHrCandidateInvitation(candidate.id, {
        position: payload.position,
        message: payload.message,
        sendNow: payload.sendNow,
        scheduledAt: payload.scheduledAt,
      });
      return null;
    } catch (error) {
      console.warn("Failed to create HR invitation.", error);
      return "Не удалось создать приглашение.";
    }
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
      setIsHrCandidateProfileLoading(true);
      const run = async () => {
        const loaded = await loadHrCandidateProfile(candidateId);
        if (!loaded) {
          setSelectedHrCandidateData(null);
          setIsHrCandidateProfileLoading(false);
          return;
        }
        setSelectedHrCandidateData(loaded);
        setIsHrCandidateProfileLoading(false);
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
    setIsHrCandidateProfileLoading(true);
    let cancelled = false;
    const run = async () => {
      const loaded = await loadHrCandidateProfile(selectedHrCandidateId);
      if (cancelled) return;
      setSelectedHrCandidateData(loaded);
      setIsHrCandidateProfileLoading(false);
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

  const handleOpenHrProfileTab = useCallback(
    (tab: HrProfileTab) => {
      setHrProfileTab(tab);
      setHrView("profile");
      router.push(buildHrProfilePath(tab), { scroll: false });
    },
    [router, setHrView],
  );

  const handleOpenHrDashboardsTab = useCallback(
    (tab: HrDashboardTab) => {
      setHrDashboardTab(tab);
      setHrView("dashboards");
      router.push(buildHrDashboardsPath(tab), { scroll: false });
    },
    [router, setHrView],
  );

  useEffect(() => {
    let cancelled = false;
    const loadHrData = async () => {
      setIsHrCandidatesSearchLoading(true);
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
        setIsHrCandidatesSearchLoading(false);

        const trackedCandidates = hrCandidatesData.filter(
          (candidate) => candidate.candidateStatus !== "Не отслеживается",
        );
        if (trackedCandidates.length === 0) {
          if (!cancelled) {
            setHrTalentFeedComparison({
              text: "Недостаточно данных для сравнения",
              tone: "empty",
            });
          }
          return;
        }

        const candidateDetails = await Promise.all(
          trackedCandidates.map(async (candidate) => {
            try {
              const details = await fetchHrCandidateDetails(candidate.id);
              return details.achievements;
            } catch (error) {
              return [];
            }
          }),
        );

        const achievements = candidateDetails.flat();
        const now = new Date();
        const currentWindowStart = new Date(now);
        currentWindowStart.setDate(now.getDate() - 6);
        currentWindowStart.setHours(0, 0, 0, 0);
        const previousWindowStart = new Date(now);
        previousWindowStart.setDate(now.getDate() - 13);
        previousWindowStart.setHours(0, 0, 0, 0);
        const previousWindowEnd = new Date(now);
        previousWindowEnd.setDate(now.getDate() - 7);
        previousWindowEnd.setHours(23, 59, 59, 999);

        const currentCount = achievements.filter((achievement) => {
          const date = new Date(achievement.date);
          return date >= currentWindowStart && date <= now;
        }).length;
        const previousCount = achievements.filter((achievement) => {
          const date = new Date(achievement.date);
          return date >= previousWindowStart && date <= previousWindowEnd;
        }).length;

        let tone: HrTalentFeedComparison["tone"] = "stable";
        let text = "Столько же достижений, сколько на прошлой неделе";

        if (currentCount > previousCount) {
          tone = "up";
          const percentage =
            previousCount === 0
              ? 100
              : Math.round(((currentCount - previousCount) / previousCount) * 100);
          text = `На ${percentage}% больше достижений, чем на прошлой неделе`;
        } else if (currentCount < previousCount) {
          tone = "down";
          const percentage =
            previousCount === 0
              ? 100
              : Math.round(((previousCount - currentCount) / previousCount) * 100);
          text = `На ${percentage}% меньше достижений, чем на прошлой неделе`;
        }

        if (!cancelled) {
          setHrTalentFeedComparison({ text, tone });
        }
      } catch (error) {
        if (!cancelled) {
          setHrHomeSummary({ topByAchievements: [], topBySubscribers: [] });
          setHrCandidates([]);
          setHrTalentFeedComparison({
            text: "Недостаточно данных для сравнения",
            tone: "empty",
          });
        }
      } finally {
        if (!cancelled) {
          setIsHrCandidatesSearchLoading(false);
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

  return {
    currentUser,
    setCurrentUser,
    hrView,
    setHrView,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    hrCandidatesSearchFilters,
    isHrCandidatesSearchLoading,
    isHrCandidateProfileLoading,
    setHrCandidatesSearchFilters,
    handleChangePassword,
    handleDeleteAccount,
    hrTopByAchievements,
    hrTopBySubscribers,
    hrHomeNotifications,
    hrTalentFeedComparison,
    hrPublishedEventsCount,
    hrDefaultInviteComment,
    hrActionConfirmSettings,
    hrCandidates,
    selectedHrCandidate,
    selectedHrCandidateAchievements,
    selectedHrCandidateEvents,
    selectedHrCandidateStatus,
    selectedHrCandidateStatusHistory,
    selectedHrCandidateNote,
    selectedHrCandidateSubscribers,
    isSelectedCandidateSubscribedByCurrentHr,
    selectedHrProfileUser,
    selectedEvent,
    selectedEventApplications,
    eventOrganizerInfo,
    organizerComputedStats,
    openHrCandidateFromHome: (candidateId: string) =>
      handleOpenHrCandidateProfile(candidateId, "home"),
    openHrCandidateFromDashboards: (candidateId: string) =>
      handleOpenHrCandidateProfile(candidateId, "dashboards"),
    openHrCandidateFromSearch: (candidateId: string) =>
      handleOpenHrCandidateProfile(candidateId, "candidates-search"),
    openHrEvent: handleOpenHrEvent,
    moveHrCandidateStatus: handleMoveHrCandidateStatus,
    addHrCandidateToFunnel: handleAddCandidateToFunnel,
    archiveHrCandidate: handleArchiveHrCandidate,
    inviteHrCandidate: handleInviteHrCandidate,
    saveHrCandidateNote: handleSaveHrCandidateNote,
    toggleHrCandidateSubscription: handleToggleHrCandidateSubscription,
    openCandidateSubscribers: () => setHrView("candidate-subscribers"),
    openSubscriberProfile: (hrId: string) => {
      setSelectedHrProfileId(hrId);
      setHrView("subscriber-profile");
    },
    closeHrCandidateProfile: () => {
      setSelectedHrProfileId(null);
      setSelectedHrCandidateId(null);
      setSelectedHrCandidateData(null);
      setHrView(hrCandidateBackView);
    },
    backToCandidateProfile: () => setHrView("candidate-profile"),
    backFromSubscriberProfile: () => setHrView("candidate-subscribers"),
    backFromEventDetails: () => {
      setSelectedEventId(null);
      setHrView(selectedHrCandidateId ? "candidate-profile" : "candidates-search");
    },
    updateHrDefaultInviteComment: handleUpdateHrDefaultInviteComment,
    updateHrActionConfirmSettings: handleUpdateHrActionConfirmSettings,
    hrDashboardTab,
    openHrDashboardsTab: handleOpenHrDashboardsTab,
    hrProfileTab,
    openHrProfileTab: handleOpenHrProfileTab,
  };
}
