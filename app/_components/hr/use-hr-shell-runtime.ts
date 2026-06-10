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
  fetchHrFeedNews,
  fetchHrFeedRecommendations,
  fetchHrHome,
  fetchHrSettings,
  fetchNotifications,
  fetchPublicEvents,
  fetchPublicHrProfile,
  markHrFeedNewsViewed,
  markHrFeedRecommendationsViewed,
  type HrFeedNewsItem,
  type HrFeedRecommendationsItem,
  type HrRecommendationsFilter,
  toggleHrCandidateSubscriptionApi,
  updateHrCandidateNote,
  updateHrCandidateStatus,
  updateHrSettings,
} from "@/lib/backend-api";
import { useEventsStore } from "@/stores/events-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import {
  buildHrDashboardsPath,
  buildHrHomePath,
  buildHrProfilePath,
  buildHrCandidateProfilePath,
  buildPathForCurrentView,
  resolveHrDashboardsTab,
  resolveHrHomeTab,
  resolveHrProfileTab,
  type HrDashboardTab,
  type HrHomeTab,
  type HrProfileTab,
} from "@/app/shared/routing/app-shell-routes";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";

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
const HR_NEWS_FEED_PAGE_LIMIT = 20;
const HR_RECOMMENDATIONS_PAGE_LIMIT = 20;

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
  const [hrNewsFeedItems, setHrNewsFeedItems] = useState<HrFeedNewsItem[]>([]);
  const [hrNewsFeedNextPage, setHrNewsFeedNextPage] = useState<string | null>(
    null,
  );
  const [hrNewsFeedIsLoadingInitial, setHrNewsFeedIsLoadingInitial] =
    useState(false);
  const [hrNewsFeedIsLoadingMore, setHrNewsFeedIsLoadingMore] = useState(false);
  const [hrNewsFeedError, setHrNewsFeedError] = useState<string | null>(null);
  const [hrNewsFeedEmptyMessage, setHrNewsFeedEmptyMessage] = useState<
    string | null
  >(null);
  const [hrRecommendationsItems, setHrRecommendationsItems] = useState<
    HrFeedRecommendationsItem[]
  >([]);
  const [hrRecommendationsNextPage, setHrRecommendationsNextPage] = useState<
    string | null
  >(null);
  const [
    hrRecommendationsIsLoadingInitial,
    setHrRecommendationsIsLoadingInitial,
  ] = useState(false);
  const [hrRecommendationsIsLoadingMore, setHrRecommendationsIsLoadingMore] =
    useState(false);
  const [hrRecommendationsError, setHrRecommendationsError] = useState<
    string | null
  >(null);
  const [hrRecommendationsEmptyMessage, setHrRecommendationsEmptyMessage] =
    useState<string | null>(null);
  const [hrRecommendationsFilter, setHrRecommendationsFilter] =
    useState<HrRecommendationsFilter>("all");
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
  const [hrHomeTab, setHrHomeTab] = useState<HrHomeTab>(() => {
    return resolveHrHomeTab(pathname);
  });
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [isHrCandidatesSearchLoading, setIsHrCandidatesSearchLoading] =
    useState(true);
  const [isHrCandidateProfileLoading, setIsHrCandidateProfileLoading] =
    useState(false);
  const hrHomeSummaryLoadedRef = useRef(false);
  const hrCandidatesSearchLoadedRef = useRef(false);
  const hrNewsFeedSeenIdsRef = useRef<Set<string>>(new Set());
  const hrNewsFeedViewedQueuedIdsRef = useRef<Set<string>>(new Set());
  const hrNewsFeedViewedInflightRef = useRef(false);
  const hrNewsFeedHasRequestedInitialRef = useRef(false);
  const hrRecommendationsSeenIdsRef = useRef<Set<string>>(new Set());
  const hrRecommendationsViewedQueuedIdsRef = useRef<Set<string>>(new Set());
  const hrRecommendationsViewedInflightRef = useRef(false);
  const hrRecommendationsHasRequestedInitialRef = useRef(false);
  const hrRecommendationsInitialRequestIdRef = useRef(0);

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
    if (pathParts[1] === "home") {
      setHrHomeTab(resolveHrHomeTab(pathname));
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
    } else if (hrView === "home") {
      resolvedPath = buildHrHomePath(hrHomeTab);
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
    hrHomeTab,
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
      const selectedStatus =
        selectedHrCandidateData?.candidate?.id === candidateId
          ? selectedHrCandidateData.status
          : undefined;
      return (
        candidate?.candidateStatus ??
        selectedStatus ??
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
      fromStatus?: HrFunnelStatus,
    ): Promise<string | null> => {
      const currentStatus = fromStatus ?? getCandidateStatusById(candidateId);
      if (currentStatus === toStatus) return null;
      if (!canMoveHrCandidateStatus(currentStatus, toStatus)) {
        return `Переход из «${currentStatus}» в «${toStatus}» запрещен.`;
      }
      try {
        await updateHrCandidateStatus(candidateId, toStatus, note);
        updateCandidateStatusState(candidateId, toStatus);
        showSuccessToast("Статус кандидата обновлен");
        return null;
      } catch (error) {
        console.warn("Failed to update HR candidate status.", error);
        showErrorToast("Не удалось обновить статус кандидата.");
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
      setHrNewsFeedItems((prev) =>
        prev.map((item) =>
          item.student.id === candidateId
            ? {
                ...item,
                actions: { ...item.actions, canAddToFunnel: false },
              }
            : item,
        ),
      );
      setHrRecommendationsItems((prev) =>
        prev.map((item) =>
          item.student.id === candidateId
            ? {
                ...item,
                currentHrStatus: "На рассмотрении",
                isInFunnel: true,
                actions: { ...item.actions, canAddToFunnel: false },
              }
            : item,
        ),
      );
      showSuccessToast("Кандидат добавлен в воронку");
      return null;
    } catch (error) {
      console.warn("Failed to add candidate to funnel.", error);
      showErrorToast("Не удалось добавить кандидата в воронку.");
      return "Не удалось добавить кандидата в воронку.";
    }
  };

  const handleToggleRecommendationSubscription = async (
    candidateId: string,
  ): Promise<string | null> => {
    const previousItem = hrRecommendationsItems.find(
      (item) => item.student.id === candidateId,
    );
    if (!previousItem) {
      return null;
    }

    setHrRecommendationsItems((prev) =>
      prev.map((item) => {
        if (item.student.id !== candidateId) return item;
        return { ...item, isSubscribed: !item.isSubscribed };
      }),
    );

    try {
      const result = await toggleHrCandidateSubscriptionApi(candidateId);
      setHrRecommendationsItems((prev) =>
        prev.map((item) =>
          item.student.id === candidateId
            ? { ...item, isSubscribed: result.isSubscribed }
            : item,
        ),
      );
      showSuccessToast(
        result.isSubscribed
          ? "Подписка на кандидата оформлена"
          : "Подписка на кандидата отменена",
      );
      return null;
    } catch (error) {
      console.warn("Failed to toggle recommendation subscription.", error);
      setHrRecommendationsItems((prev) =>
        prev.map((item) =>
          item.student.id === candidateId
            ? { ...item, isSubscribed: previousItem.isSubscribed }
            : item,
        ),
      );
      showErrorToast("Не удалось обновить подписку.");
      return "Не удалось обновить подписку.";
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
      showSuccessToast("Кандидат перемещен в архив");
      return null;
    } catch (error) {
      console.warn("Failed to archive HR candidate.", error);
      showErrorToast("Не удалось переместить кандидата в архив.");
      return "Не удалось переместить кандидата в архив.";
    }
  };

  const handleInviteHrCandidate = async (
    candidateId: string,
    payload: HrInvitationPayload,
    fromStatus?: HrFunnelStatus,
  ): Promise<string | null> => {
    if (!payload.message.trim()) return "Комментарий к приглашению обязателен.";
    const currentStatus = fromStatus ?? getCandidateStatusById(candidateId);
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
      candidateId,
      "Приглашён",
      inviteNote,
      currentStatus,
    );
    if (moveError) return moveError;
    try {
      await createHrCandidateInvitation(candidateId, {
        position: payload.position,
        message: payload.message,
        sendNow: payload.sendNow,
        scheduledAt: payload.scheduledAt,
      });
      showSuccessToast("Приглашение отправлено");
      return null;
    } catch (error) {
      console.warn("Failed to create HR invitation.", error);
      showErrorToast("Не удалось создать приглашение.");
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
      showSuccessToast("Заметка сохранена");
    } catch (error) {
      console.warn("Failed to update HR note.", error);
      showErrorToast("Не удалось сохранить заметку.");
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
        showSuccessToast(
          result.isSubscribed
            ? "Подписка на кандидата оформлена"
            : "Подписка на кандидата отменена",
        );
      } catch (error) {
        console.warn("Failed to toggle HR subscription.", error);
        showErrorToast("Не удалось обновить подписку.");
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
      showSuccessToast("Настройки приглашения сохранены");
    } catch (error) {
      console.warn("Failed to update HR settings.", error);
      showErrorToast("Не удалось сохранить настройки HR.");
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
      showSuccessToast("Настройки действий сохранены");
    } catch (error) {
      console.warn("Failed to update HR settings.", error);
      showErrorToast("Не удалось сохранить настройки HR.");
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

  const handleOpenHrHomeTab = useCallback(
    (tab: HrHomeTab) => {
      setHrHomeTab(tab);
      setHrView("home");
      router.push(buildHrHomePath(tab), { scroll: false });
    },
    [router, setHrView],
  );

  const loadInitialHrNewsFeed = useCallback(async () => {
    if (hrNewsFeedIsLoadingInitial) return;
    setHrNewsFeedIsLoadingInitial(true);
    setHrNewsFeedError(null);
    try {
      const page = await fetchHrFeedNews({ limit: HR_NEWS_FEED_PAGE_LIMIT });
      setHrNewsFeedItems(page.items);
      setHrNewsFeedNextPage(page.nextPage);
      setHrNewsFeedEmptyMessage(page.emptyMessage);
      hrNewsFeedSeenIdsRef.current = new Set(page.items.map((item) => item.newsId));
    } catch (error) {
      console.warn("Failed to load HR news feed.", error);
      setHrNewsFeedItems([]);
      setHrNewsFeedNextPage(null);
      setHrNewsFeedEmptyMessage(null);
      setHrNewsFeedError("Не удалось загрузить ленту новостей.");
    } finally {
      setHrNewsFeedIsLoadingInitial(false);
    }
  }, [hrNewsFeedIsLoadingInitial]);

  const loadMoreHrNewsFeed = useCallback(async () => {
    if (!hrNewsFeedNextPage || hrNewsFeedIsLoadingInitial || hrNewsFeedIsLoadingMore) {
      return;
    }
    setHrNewsFeedIsLoadingMore(true);
    setHrNewsFeedError(null);
    try {
      const page = await fetchHrFeedNews({
        limit: HR_NEWS_FEED_PAGE_LIMIT,
        pageToken: hrNewsFeedNextPage,
      });
      setHrNewsFeedItems((prev) => {
        const seen = hrNewsFeedSeenIdsRef.current;
        const uniqueItems = page.items.filter((item) => !seen.has(item.newsId));
        uniqueItems.forEach((item) => seen.add(item.newsId));
        return uniqueItems.length > 0 ? [...prev, ...uniqueItems] : prev;
      });
      setHrNewsFeedNextPage(page.nextPage);
      setHrNewsFeedEmptyMessage((prev) => prev ?? page.emptyMessage);
    } catch (error) {
      console.warn("Failed to load more HR news feed.", error);
      setHrNewsFeedError("Не удалось подгрузить следующие новости.");
    } finally {
      setHrNewsFeedIsLoadingMore(false);
    }
  }, [hrNewsFeedIsLoadingInitial, hrNewsFeedIsLoadingMore, hrNewsFeedNextPage]);

  const flushViewedHrNews = useCallback(async () => {
    if (hrNewsFeedViewedInflightRef.current) return;
    const ids = Array.from(hrNewsFeedViewedQueuedIdsRef.current);
    if (ids.length === 0) return;
    hrNewsFeedViewedInflightRef.current = true;
    hrNewsFeedViewedQueuedIdsRef.current.clear();
    let hasFailed = false;
    try {
      await markHrFeedNewsViewed(ids);
    } catch (error) {
      hasFailed = true;
      console.warn("Failed to mark HR news as viewed.", error);
      ids.forEach((id) => hrNewsFeedViewedQueuedIdsRef.current.add(id));
    } finally {
      hrNewsFeedViewedInflightRef.current = false;
      if (!hasFailed && hrNewsFeedViewedQueuedIdsRef.current.size > 0) {
        void flushViewedHrNews();
      }
    }
  }, []);

  const markViewedHrNews = useCallback(
    (ids: string[]) => {
      const normalized = ids.map((id) => id.trim()).filter(Boolean);
      if (normalized.length === 0) return;
      normalized.forEach((id) => hrNewsFeedViewedQueuedIdsRef.current.add(id));
      void flushViewedHrNews();
    },
    [flushViewedHrNews],
  );

  const loadInitialHrRecommendations = useCallback(
    async (filter: HrRecommendationsFilter) => {
      const requestId = ++hrRecommendationsInitialRequestIdRef.current;
      setHrRecommendationsIsLoadingInitial(true);
      setHrRecommendationsIsLoadingMore(false);
      setHrRecommendationsError(null);
      setHrRecommendationsItems([]);
      setHrRecommendationsNextPage(null);
      setHrRecommendationsEmptyMessage(null);
      hrRecommendationsSeenIdsRef.current = new Set();
      try {
        const page = await fetchHrFeedRecommendations({
          filter,
          limit: HR_RECOMMENDATIONS_PAGE_LIMIT,
        });
        if (requestId !== hrRecommendationsInitialRequestIdRef.current) return;
        setHrRecommendationsItems(page.items);
        setHrRecommendationsNextPage(page.nextPage);
        setHrRecommendationsEmptyMessage(page.emptyMessage);
        hrRecommendationsSeenIdsRef.current = new Set(
          page.items.map((item) => item.recommendationId),
        );
      } catch (error) {
        if (requestId !== hrRecommendationsInitialRequestIdRef.current) return;
        console.warn("Failed to load HR recommendations feed.", error);
        setHrRecommendationsItems([]);
        setHrRecommendationsNextPage(null);
        setHrRecommendationsEmptyMessage(null);
        setHrRecommendationsError("Не удалось загрузить ленту рекомендаций.");
      } finally {
        if (requestId !== hrRecommendationsInitialRequestIdRef.current) return;
        setHrRecommendationsIsLoadingInitial(false);
      }
    },
    [],
  );

  const loadMoreHrRecommendations = useCallback(async () => {
    if (
      !hrRecommendationsNextPage ||
      hrRecommendationsIsLoadingInitial ||
      hrRecommendationsIsLoadingMore
    ) {
      return;
    }
    setHrRecommendationsIsLoadingMore(true);
    setHrRecommendationsError(null);
    try {
      const page = await fetchHrFeedRecommendations({
        filter: hrRecommendationsFilter,
        limit: HR_RECOMMENDATIONS_PAGE_LIMIT,
        pageToken: hrRecommendationsNextPage,
      });
      setHrRecommendationsItems((prev) => {
        const seen = hrRecommendationsSeenIdsRef.current;
        const uniqueItems = page.items.filter(
          (item) => !seen.has(item.recommendationId),
        );
        uniqueItems.forEach((item) => seen.add(item.recommendationId));
        return uniqueItems.length > 0 ? [...prev, ...uniqueItems] : prev;
      });
      setHrRecommendationsNextPage(page.nextPage);
      setHrRecommendationsEmptyMessage((prev) => prev ?? page.emptyMessage);
    } catch (error) {
      console.warn("Failed to load more HR recommendations feed.", error);
      setHrRecommendationsError("Не удалось подгрузить следующие рекомендации.");
    } finally {
      setHrRecommendationsIsLoadingMore(false);
    }
  }, [
    hrRecommendationsFilter,
    hrRecommendationsIsLoadingInitial,
    hrRecommendationsIsLoadingMore,
    hrRecommendationsNextPage,
  ]);

  const flushViewedHrRecommendations = useCallback(async () => {
    if (hrRecommendationsViewedInflightRef.current) return;
    const ids = Array.from(hrRecommendationsViewedQueuedIdsRef.current);
    if (ids.length === 0) return;
    hrRecommendationsViewedInflightRef.current = true;
    hrRecommendationsViewedQueuedIdsRef.current.clear();
    let hasFailed = false;
    try {
      await markHrFeedRecommendationsViewed(ids);
    } catch (error) {
      hasFailed = true;
      console.warn("Failed to mark HR recommendations as viewed.", error);
      ids.forEach((id) => hrRecommendationsViewedQueuedIdsRef.current.add(id));
    } finally {
      hrRecommendationsViewedInflightRef.current = false;
      if (
        !hasFailed &&
        hrRecommendationsViewedQueuedIdsRef.current.size > 0
      ) {
        void flushViewedHrRecommendations();
      }
    }
  }, []);

  const markViewedHrRecommendations = useCallback(
    (candidateIds: string[]) => {
      const normalized = candidateIds.map((id) => id.trim()).filter(Boolean);
      if (normalized.length === 0) return;
      normalized.forEach((id) =>
        hrRecommendationsViewedQueuedIdsRef.current.add(id),
      );
      void flushViewedHrRecommendations();
    },
    [flushViewedHrRecommendations],
  );

  const handleSetHrRecommendationsFilter = useCallback(
    (nextFilter: HrRecommendationsFilter) => {
      if (nextFilter === hrRecommendationsFilter) return;
      setHrRecommendationsFilter(nextFilter);
      hrRecommendationsHasRequestedInitialRef.current = true;
      void loadInitialHrRecommendations(nextFilter);
    },
    [hrRecommendationsFilter, loadInitialHrRecommendations],
  );

  useEffect(() => {
    if (
      hrView !== "home" ||
      hrHomeTab !== "news" ||
      hrNewsFeedHasRequestedInitialRef.current
    ) {
      return;
    }
    hrNewsFeedHasRequestedInitialRef.current = true;
    void loadInitialHrNewsFeed();
  }, [hrHomeTab, hrView, loadInitialHrNewsFeed]);

  useEffect(() => {
    if (
      hrView !== "home" ||
      hrHomeTab !== "recommendations" ||
      hrRecommendationsHasRequestedInitialRef.current
    ) {
      return;
    }
    hrRecommendationsHasRequestedInitialRef.current = true;
    void loadInitialHrRecommendations(hrRecommendationsFilter);
  }, [
    hrHomeTab,
    hrRecommendationsFilter,
    hrView,
    loadInitialHrRecommendations,
  ]);

  useEffect(() => {
    if (hrView !== "home" || hrHomeTab !== "summary" || hrHomeSummaryLoadedRef.current) {
      return;
    }
    let cancelled = false;
    const loadHrHomeSummary = async () => {
      try {
        const hrHomeData = await fetchHrHome();
        if (cancelled) return;
        setHrHomeSummary({
          topByAchievements: hrHomeData.topByAchievements,
          topBySubscribers: hrHomeData.topBySubscribers,
        });
      } catch (error) {
        if (!cancelled) {
          setHrHomeSummary({ topByAchievements: [], topBySubscribers: [] });
        }
      } finally {
        if (!cancelled) {
          hrHomeSummaryLoadedRef.current = true;
        }
      }
    };
    loadHrHomeSummary();
    return () => {
      cancelled = true;
    };
  }, [hrHomeTab, hrView]);

  useEffect(() => {
    if (hrView !== "candidates-search" || hrCandidatesSearchLoadedRef.current) {
      return;
    }
    let cancelled = false;
    const loadHrCandidatesSearch = async () => {
      setIsHrCandidatesSearchLoading(true);
      try {
        const hrCandidatesData = await fetchHrCandidatesSearch();
        if (cancelled) return;
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
          setHrCandidates([]);
        }
      } finally {
        if (!cancelled) {
          setIsHrCandidatesSearchLoading(false);
          hrCandidatesSearchLoadedRef.current = true;
        }
      }
    };
    loadHrCandidatesSearch();
    return () => {
      cancelled = true;
    };
  }, [hrView]);

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
    hrNewsFeedItems,
    hrNewsFeedNextPage,
    hrNewsFeedEmptyMessage,
    hrNewsFeedError,
    hrNewsFeedHasMore: Boolean(hrNewsFeedNextPage),
    hrNewsFeedIsLoadingInitial,
    hrNewsFeedIsLoadingMore,
    loadInitialHrNewsFeed,
    loadMoreHrNewsFeed,
    markViewedHrNews,
    hrRecommendationsItems,
    hrRecommendationsNextPage,
    hrRecommendationsEmptyMessage,
    hrRecommendationsError,
    hrRecommendationsHasMore: Boolean(hrRecommendationsNextPage),
    hrRecommendationsIsLoadingInitial,
    hrRecommendationsIsLoadingMore,
    hrRecommendationsFilter,
    loadInitialHrRecommendations,
    loadMoreHrRecommendations,
    markViewedHrRecommendations,
    setHrRecommendationsFilter: handleSetHrRecommendationsFilter,
    toggleHrRecommendationSubscription: handleToggleRecommendationSubscription,
    hrHomeTab,
    openHrHomeTab: handleOpenHrHomeTab,
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
