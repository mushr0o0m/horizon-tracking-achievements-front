"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Achievement,
  AppNotification,
  AuthUser,
  CourseOption,
  Event,
  EventApplication,
  EventType,
  NotificationSettings,
  OrganizerEventLevel,
  OrganizerEventType,
  OrganizerNotificationChannel,
  OrganizerNotificationSettings,
  OrganizerOrganizationProfile,
  OrganizerSocialLinks,
  OrganizationType,
  Participant,
  PublicProfile,
  SocialLinks,
  UserRole,
  StudentView,
  OrganizerView,
  HrView,
  AchievementLevel,
} from "@/lib/types";
import { calculateStudentMetrics } from "@/lib/metrics";
import { Sidebar } from "@/components/shared/sidebar";
import { TopBar } from "@/components/shared/topbar";
import { HomePage } from "@/components/student/home-page";
import { DashboardsPage } from "@/components/student/dashboards-page";
import { AchievementsPage } from "@/components/student/achievements-page";
import {
  StudentEventsPage,
  StudentEventsTab,
} from "@/components/student/student-events-page";
import { StudentInvitationsPage } from "@/components/student/student-invitations-page";
import { OrganizerEvents } from "@/components/organizer/organizer-events";
import { EventForm } from "@/components/organizer/event-form";
import { UploadResults } from "@/components/organizer/upload-results";
import { ProfilePage } from "@/components/student/profile-page";
import { OrganizerProfilePage } from "@/components/organizer/organizer-profile-page";
import { EventDetailsPage } from "@/components/shared/event-details-page";
import { AchievementRequestForm } from "@/components/student/achievement-request-form";
import { VerificationRequestsPage } from "@/components/organizer/verification-requests-page";
import { AchievementDetailsModal } from "@/components/student/achievement-details-modal";
import {
  HrHomePage,
  HrHomeTopAchievementCandidate,
  HrHomeTopSubscriberCandidate,
} from "@/components/hr/hr-home-page";
import { HrDashboardsPage } from "@/components/hr/hr-dashboards-page";
import {
  HrCandidateSummary,
  HrCandidatesSearchPage,
} from "@/components/hr/hr-candidates-search-page";
import {
  HrCandidateProfilePage,
  HrInvitationPayload,
} from "@/components/hr/hr-candidate-profile-page";
import { SubscribersPage } from "@/components/shared/subscribers-page";
import { HrPublicProfilePage } from "@/components/hr/hr-public-profile-page";
import {
  LoginPayload,
  RegisterForm,
  RegistrationPayload,
} from "@/components/shared/register-form";
import {
  EVENT_LEVEL_TO_ACHIEVEMENT_LEVEL,
  EVENT_TYPE_TO_ACHIEVEMENT_TYPE,
} from "@/lib/event-meta";
import {
  EventFormPayload,
  EventsStoreProvider,
  useEventsStore,
} from "@/stores/events-store";
import {
  AchievementsStoreProvider,
  useAchievementsStore,
} from "@/stores/achievements-store";
import {
  NotificationsStoreProvider,
  useNotificationsStore,
} from "@/stores/notifications-store";
import { useOrganizerEvents } from "@/hooks/use-organizer-events";
import { buildBadgeViewModels } from "@/lib/badges";
import { HrFunnelStatus, HrStatusHistoryEntry } from "@/lib/hr-funnel";
import type {
  HrActionConfirmSettings,
  HrCandidateInvitation,
} from "@/lib/hr-network";
import { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import { cn } from "@/lib/utils";
import {
  backendLogin,
  backendRegister,
  backendGetProfile,
  backendChangePassword,
  clearBackendToken,
  createHrCandidateInvitation,
  createOrganizerEvent,
  createStudentAchievement,
  deleteOrganizerEvent,
  fetchHrCandidateDetails,
  fetchHrCandidatesSearch,
  fetchHrHome,
  fetchHrSettings,
  fetchNotifications,
  fetchOrganizerEventParticipants,
  fetchOrganizerEvents,
  fetchOrganizerVerificationRequests,
  fetchPublicEvents,
  fetchPublicHrProfile,
  fetchPublicOrganizerProfile,
  fetchStudentAchievements,
  fetchStudentInvitations,
  fetchStudentSubscribers,
  hasBackendToken,
  markAllNotificationsRead,
  markNotificationRead,
  publishOrganizerResults,
  registerStudentForEvent,
  rejectAchievementRequest,
  respondToStudentInvitation,
  toggleHrCandidateSubscriptionApi,
  unregisterStudentForEvent,
  updateHrCandidateNote,
  updateHrCandidateStatus,
  updateHrSettings,
  updateOrganizerEvent,
  updateOrganizerProfile,
  updateStudentProfile,
  verifyAchievementRequest,
  archiveHrCandidate,
} from "@/lib/backend-api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ACHIEVEMENT_EVENT_TO_ORGANIZER_TYPE: Record<
  EventType,
  OrganizerEventType
> = {
  Олимпиада: "olympiad",
  Конкурс: "course",
  Хакатон: "hackathon",
  Конференция: "conference",
  Чемпионат: "other",
  Другое: "other",
};

const ACHIEVEMENT_LEVEL_TO_ORGANIZER_LEVEL: Record<
  AchievementLevel,
  OrganizerEventLevel
> = {
  Международный: "international",
  Всероссийский: "national",
  Региональный: "regional",
  Вузовский: "university",
  Факультетский: "school",
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  invitations: true,
  verification: true,
  recommendations: true,
};

const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  telegram: "",
  github: "",
  linkedin: "",
  website: "",
  customLinks: [],
};

const DEFAULT_ORGANIZER_NOTIFICATION_CHANNELS: OrganizerNotificationChannel[] =
  ["interface", "email"];
const DEFAULT_ORGANIZER_NOTIFICATIONS: OrganizerNotificationSettings = {
  verificationRequests: true,
  newRegistrations: true,
  reports: true,
  deliveryChannels: [...DEFAULT_ORGANIZER_NOTIFICATION_CHANNELS],
};

const DEFAULT_ORGANIZER_SOCIAL_LINKS: OrganizerSocialLinks = {
  telegram: "",
  vk: "",
  youtube: "",
  other: [],
};

const HR_KANBAN_STATUSES = [
  "На рассмотрении",
  "Интересует",
  "Приглашён",
  "Ответили на приглашение",
  "Отклонён",
] as const;

type HrKanbanStatus = (typeof HR_KANBAN_STATUSES)[number];

const HR_STATUS_TRANSITIONS: Record<HrKanbanStatus, HrKanbanStatus[]> = {
  "На рассмотрении": ["Интересует", "Отклонён"],
  Интересует: ["Приглашён", "Отклонён"],
  Приглашён: ["Ответили на приглашение", "Отклонён"],
  "Ответили на приглашение": ["Отклонён"],
  Отклонён: [...HR_KANBAN_STATUSES],
};

function isHrKanbanStatus(status: HrFunnelStatus): status is HrKanbanStatus {
  return HR_KANBAN_STATUSES.includes(status as HrKanbanStatus);
}

function canMoveHrCandidateStatus(
  fromStatus: HrFunnelStatus,
  toStatus: HrFunnelStatus,
): boolean {
  if (!isHrKanbanStatus(fromStatus) || !isHrKanbanStatus(toStatus)) {
    return false;
  }

  return HR_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

function parseName(name: string): {
  firstName: string;
  lastName: string;
  middleName?: string;
} {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] ?? "",
    firstName: parts[1] ?? parts[0] ?? "",
    middleName: parts[2] ?? "",
  };
}

function normalizeCourse(raw: unknown): CourseOption {
  const allowed: CourseOption[] = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "graduate",
    "magister",
    "postgraduate",
  ];
  return typeof raw === "string" && (allowed as string[]).includes(raw)
    ? (raw as CourseOption)
    : "1";
}

function normalizeSocialLinks(raw: unknown): SocialLinks {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SOCIAL_LINKS };
  }

  const maybe = raw as Partial<SocialLinks>;
  return {
    telegram: typeof maybe.telegram === "string" ? maybe.telegram : "",
    github: typeof maybe.github === "string" ? maybe.github : "",
    linkedin: typeof maybe.linkedin === "string" ? maybe.linkedin : "",
    website: typeof maybe.website === "string" ? maybe.website : "",
    customLinks: Array.isArray(maybe.customLinks)
      ? maybe.customLinks
          .filter((item): item is string => typeof item === "string")
          .slice(0, 5)
      : [],
  };
}

function buildDefaultPublicProfile(name: string): PublicProfile {
  const parsed = parseName(name);
  return {
    avatarUrl: undefined,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    middleName: parsed.middleName,
    university: "",
    faculty: "",
    course: "1",
    city: "",
    bio: "",
    socialLinks: { ...DEFAULT_SOCIAL_LINKS },
    profileViews30d: 0,
    visibleAchievementIds: [],
    visibleBadgeIds: [],
  };
}

function normalizeOrganizationType(raw: unknown): OrganizationType {
  const allowed: OrganizationType[] = [
    "university",
    "scientific",
    "olympiad",
    "conference",
    "foundation",
    "educational",
    "other",
  ];

  return typeof raw === "string" && (allowed as string[]).includes(raw)
    ? (raw as OrganizationType)
    : "other";
}

function normalizeOrganizerSocialLinks(raw: unknown): OrganizerSocialLinks {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_ORGANIZER_SOCIAL_LINKS };
  }

  const maybe = raw as Partial<OrganizerSocialLinks>;
  return {
    telegram: typeof maybe.telegram === "string" ? maybe.telegram : "",
    vk: typeof maybe.vk === "string" ? maybe.vk : "",
    youtube: typeof maybe.youtube === "string" ? maybe.youtube : "",
    other: Array.isArray(maybe.other)
      ? maybe.other
          .filter((item): item is string => typeof item === "string")
          .slice(0, 5)
      : [],
  };
}

function buildDefaultOrganizerProfile(
  _name: string,
  email: string,
): OrganizerOrganizationProfile {
  return {
    logoUrl: undefined,
    organizationName: "",
    shortName: "",
    organizationType: "other",
    website: "",
    description: "",
    contactEmail: email,
    contactPhone: "",
    socialLinks: { ...DEFAULT_ORGANIZER_SOCIAL_LINKS },
    foundedYear: undefined,
    eventsCount: 0,
    totalParticipants: 0,
  };
}

function normalizeOrganizerProfile(
  raw: unknown,
  fallbackName: string,
  fallbackEmail: string,
): OrganizerOrganizationProfile {
  const fallback = buildDefaultOrganizerProfile(fallbackName, fallbackEmail);
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const maybe = raw as Partial<OrganizerOrganizationProfile>;
  return {
    logoUrl:
      typeof maybe.logoUrl === "string" ? maybe.logoUrl : fallback.logoUrl,
    organizationName:
      typeof maybe.organizationName === "string"
        ? maybe.organizationName
        : fallback.organizationName,
    shortName:
      typeof maybe.shortName === "string"
        ? maybe.shortName
        : fallback.shortName,
    organizationType: normalizeOrganizationType(maybe.organizationType),
    website: typeof maybe.website === "string" ? maybe.website : "",
    description:
      typeof maybe.description === "string"
        ? maybe.description.slice(0, 2000)
        : "",
    contactEmail:
      typeof maybe.contactEmail === "string" && maybe.contactEmail.trim()
        ? maybe.contactEmail
        : fallback.contactEmail,
    contactPhone:
      typeof maybe.contactPhone === "string" ? maybe.contactPhone : "",
    socialLinks: normalizeOrganizerSocialLinks(maybe.socialLinks),
    foundedYear:
      typeof maybe.foundedYear === "number" &&
      Number.isFinite(maybe.foundedYear)
        ? Math.max(1800, Math.min(2100, Math.floor(maybe.foundedYear)))
        : undefined,
    eventsCount:
      typeof maybe.eventsCount === "number" &&
      Number.isFinite(maybe.eventsCount)
        ? Math.max(0, Math.floor(maybe.eventsCount))
        : 0,
    totalParticipants:
      typeof maybe.totalParticipants === "number" &&
      Number.isFinite(maybe.totalParticipants)
        ? Math.max(0, Math.floor(maybe.totalParticipants))
        : 0,
  };
}

function normalizeOrganizerNotifications(
  raw: unknown,
): OrganizerNotificationSettings {
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_ORGANIZER_NOTIFICATIONS,
      deliveryChannels: [...DEFAULT_ORGANIZER_NOTIFICATIONS.deliveryChannels],
    };
  }

  const maybe = raw as Partial<OrganizerNotificationSettings>;
  const allowedChannels: OrganizerNotificationChannel[] = [
    "interface",
    "email",
    "push",
    "telegram",
  ];
  const normalizedChannels = Array.isArray(maybe.deliveryChannels)
    ? Array.from(
        new Set(
          maybe.deliveryChannels.filter(
            (channel): channel is OrganizerNotificationChannel =>
              typeof channel === "string" &&
              (allowedChannels as string[]).includes(channel),
          ),
        ),
      )
    : [];

  return {
    verificationRequests:
      typeof maybe.verificationRequests === "boolean"
        ? maybe.verificationRequests
        : DEFAULT_ORGANIZER_NOTIFICATIONS.verificationRequests,
    newRegistrations:
      typeof maybe.newRegistrations === "boolean"
        ? maybe.newRegistrations
        : DEFAULT_ORGANIZER_NOTIFICATIONS.newRegistrations,
    reports:
      typeof maybe.reports === "boolean"
        ? maybe.reports
        : DEFAULT_ORGANIZER_NOTIFICATIONS.reports,
    deliveryChannels:
      normalizedChannels.length > 0
        ? normalizedChannels
        : [...DEFAULT_ORGANIZER_NOTIFICATIONS.deliveryChannels],
  };
}

function normalizePublicProfile(
  raw: unknown,
  fallbackName: string,
): PublicProfile {
  const fallback = buildDefaultPublicProfile(fallbackName);
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const maybe = raw as Partial<PublicProfile>;
  return {
    avatarUrl:
      typeof maybe.avatarUrl === "string" ? maybe.avatarUrl : undefined,
    firstName:
      typeof maybe.firstName === "string"
        ? maybe.firstName
        : fallback.firstName,
    lastName:
      typeof maybe.lastName === "string" ? maybe.lastName : fallback.lastName,
    middleName:
      typeof maybe.middleName === "string"
        ? maybe.middleName
        : fallback.middleName,
    university: typeof maybe.university === "string" ? maybe.university : "",
    faculty: typeof maybe.faculty === "string" ? maybe.faculty : "",
    course: normalizeCourse(maybe.course),
    city: typeof maybe.city === "string" ? maybe.city : "",
    bio: typeof maybe.bio === "string" ? maybe.bio.slice(0, 1000) : "",
    socialLinks: normalizeSocialLinks(maybe.socialLinks),
    profileViews30d:
      typeof maybe.profileViews30d === "number" &&
      Number.isFinite(maybe.profileViews30d)
        ? Math.max(0, Math.floor(maybe.profileViews30d))
        : 0,
    visibleAchievementIds: Array.isArray(maybe.visibleAchievementIds)
      ? maybe.visibleAchievementIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    visibleBadgeIds: Array.isArray(maybe.visibleBadgeIds)
      ? maybe.visibleBadgeIds.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
}

function normalizeNotifications(raw: unknown): NotificationSettings {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_NOTIFICATIONS;
  }

  const maybe = raw as Partial<NotificationSettings>;
  return {
    invitations:
      typeof maybe.invitations === "boolean"
        ? maybe.invitations
        : DEFAULT_NOTIFICATIONS.invitations,
    verification:
      typeof maybe.verification === "boolean"
        ? maybe.verification
        : DEFAULT_NOTIFICATIONS.verification,
    recommendations:
      typeof maybe.recommendations === "boolean"
        ? maybe.recommendations
        : DEFAULT_NOTIFICATIONS.recommendations,
  };
}

function normalizeUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;

  const maybe = raw as Partial<AuthUser> & { role?: unknown };
  const id =
    typeof maybe.id === "string" && maybe.id
      ? maybe.id
      : `student-${Date.now()}`;
  const name =
    typeof maybe.name === "string" && maybe.name.trim()
      ? maybe.name.trim()
      : "Пользователь";
  const email =
    typeof maybe.email === "string" && maybe.email.trim()
      ? maybe.email.trim().toLowerCase()
      : "";
  const role: UserRole =
    maybe.role === "organizer"
      ? "organizer"
      : maybe.role === "hr"
        ? "hr"
        : "student";
  const phone = typeof maybe.phone === "string" ? maybe.phone : undefined;

  if (!email) return null;

  return {
    id,
    name,
    email,
    role,
    phone,
    notifications: normalizeNotifications(
      (maybe as { notifications?: unknown }).notifications,
    ),
    publicProfile: normalizePublicProfile(
      (maybe as { publicProfile?: unknown }).publicProfile,
      name,
    ),
    organizerProfile:
      role === "organizer" || role === "hr"
        ? normalizeOrganizerProfile(
            (maybe as { organizerProfile?: unknown }).organizerProfile,
            name,
            email,
          )
        : undefined,
    organizerNotifications:
      role === "organizer" || role === "hr"
        ? normalizeOrganizerNotifications(
            (maybe as { organizerNotifications?: unknown })
              .organizerNotifications,
          )
        : undefined,
  };
}

function AppContent() {
  // Shared state — both roles read/write these
  const {
    events,
    applications,
    setEvents,
    setApplications,
    createEvent,
    updateEvent,
    deleteEvent,
    assignEventOrganizer,
    applyResults,
    toggleApplication,
    ensureApplication,
  } = useEventsStore();
  const {
    achievements,
    setAchievements,
    addAchievements,
    removeStudentAchievements,
  } = useAchievementsStore();
  const {
    notifications,
    setNotifications,
    addNotification,
    markRead,
    markAllRead,
  } = useNotificationsStore();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);
  const [studentInvitationsState, setStudentInvitationsState] = useState<
    HrCandidateInvitation[]
  >([]);
  const [studentSubscribersState, setStudentSubscribersState] = useState<
    SubscriberPreviewItem[]
  >([]);
  const [studentAppliedEventIds, setStudentAppliedEventIds] = useState<
    string[]
  >([]);
  const [selectedEventOrganizerInfo, setSelectedEventOrganizerInfo] =
    useState<OrganizerOrganizationProfile | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Role & navigation state
  const [studentView, setStudentView] = useState<StudentView>("home");
  const [organizerView, setOrganizerView] = useState<OrganizerView>("events");
  const [hrView, setHrView] = useState<HrView>("home");
  const [hrCandidateBackView, setHrCandidateBackView] = useState<
    "home" | "dashboards" | "candidates-search"
  >("candidates-search");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<
    string | null
  >(null);
  const [selectedHrCandidateId, setSelectedHrCandidateId] = useState<
    string | null
  >(null);
  const [selectedHrProfileId, setSelectedHrProfileId] = useState<string | null>(
    null,
  );
  const [selectedHrProfileUser, setSelectedHrProfileUser] =
    useState<AuthUser | null>(null);
  const [hrHomeSummary, setHrHomeSummary] = useState<{
    topByAchievements: HrHomeTopAchievementCandidate[];
    topBySubscribers: HrHomeTopSubscriberCandidate[];
  }>({ topByAchievements: [], topBySubscribers: [] });
  const [hrCandidates, setHrCandidates] = useState<HrCandidateSummary[]>([]);
  const [selectedHrCandidateData, setSelectedHrCandidateData] = useState<{
    candidate: AuthUser | null;
    achievements: Achievement[];
    status: HrFunnelStatus;
    statusHistory: HrStatusHistoryEntry[];
    note: string;
    subscribers: SubscriberPreviewItem[];
    isCurrentHrSubscribed: boolean;
  } | null>(null);
  const [studentSubscribersReturnView, setStudentSubscribersReturnView] =
    useState<"home" | "profile">("home");
  const [hrDefaultInviteComment, setHrDefaultInviteCommentState] = useState("");
  const [hrActionConfirmSettings, setHrActionConfirmSettingsState] =
    useState<HrActionConfirmSettings>({
      confirmReject: true,
      confirmArchive: true,
    });
  const [visibilitySeededForUserId, setVisibilitySeededForUserId] = useState<
    string | null
  >(null);
  const [studentEventReturnView, setStudentEventReturnView] = useState<
    "home" | "achievements" | "events"
  >("home");
  const [studentEventsTab, setStudentEventsTab] =
    useState<StudentEventsTab>("table");

  const role: UserRole = currentUser?.role ?? "student";

  useEffect(() => {
    let cancelled = false;

    const resolveSession = async () => {
      if (!hasBackendToken()) {
        if (!cancelled) {
          setCurrentUser(null);
          setIsAuthResolved(true);
        }
        return;
      }

      try {
        const profile = await backendGetProfile();
        if (!cancelled) {
          setCurrentUser(profile);
        }
      } catch (error) {
        clearBackendToken();
        if (!cancelled) {
          setCurrentUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsAuthResolved(true);
        }
      }
    };

    resolveSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "hr") {
      setHrDefaultInviteCommentState("");
      setHrActionConfirmSettingsState({
        confirmReject: true,
        confirmArchive: true,
      });
      return;
    }
    const loadSettings = async () => {
      try {
        const settings = await fetchHrSettings();
        setHrDefaultInviteCommentState(settings.defaultInviteComment);
        setHrActionConfirmSettingsState({
          confirmReject: settings.confirmRejectAction,
          confirmArchive: settings.confirmArchiveAction,
        });
      } catch (error) {
        console.warn("Failed to load HR settings.", error);
        setHrDefaultInviteCommentState("");
        setHrActionConfirmSettingsState({
          confirmReject: true,
          confirmArchive: true,
        });
      }
    };

    loadSettings();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    const loadData = async () => {
      setIsDataLoading(true);
      try {
        if (currentUser.role === "student") {
          const [
            eventsData,
            achievementsData,
            notificationsData,
            invitationsData,
            subscribersData,
          ] = await Promise.all([
            fetchPublicEvents(),
            fetchStudentAchievements(currentUser.id),
            fetchNotifications(currentUser.id),
            fetchStudentInvitations(currentUser.id),
            fetchStudentSubscribers(),
          ]);

          if (cancelled) return;

          setEvents(eventsData);
          setAchievements(achievementsData);
          setNotifications(notificationsData);
          setStudentInvitationsState(invitationsData);
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
            acc.push({
              id,
              name,
              email: item.email ?? "",
            });
            return acc;
          }, []);
          setStudentSubscribersState(normalizedSubscribers);
          setStudentAppliedEventIds([]);
          setApplications([]);
        } else if (currentUser.role === "organizer") {
          const [eventsData, requestsData, notificationsData] =
            await Promise.all([
              fetchOrganizerEvents(),
              fetchOrganizerVerificationRequests(),
              fetchNotifications(currentUser.id),
            ]);

          if (cancelled) return;

          setEvents(eventsData);
          setAchievements(requestsData);
          setNotifications(notificationsData);
          setStudentInvitationsState([]);
          setStudentSubscribersState([]);
          setStudentAppliedEventIds([]);
          setApplications([]);
        } else {
          const [eventsData, notificationsData, hrHomeData, hrCandidatesData] =
            await Promise.all([
              fetchPublicEvents(),
              fetchNotifications(currentUser.id),
              fetchHrHome(),
              fetchHrCandidatesSearch(),
            ]);
          if (cancelled) return;

          setAchievements([]);
          setEvents(eventsData);
          setApplications([]);
          setNotifications(notificationsData);
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
        }
      } catch (error) {
        if (!cancelled) {
          setEvents([]);
          setAchievements([]);
          setNotifications([]);
          setStudentInvitationsState([]);
          setStudentSubscribersState([]);
          setStudentAppliedEventIds([]);
          setApplications([]);
          setHrHomeSummary({ topByAchievements: [], topBySubscribers: [] });
          setHrCandidates([]);
        }
      } finally {
        if (!cancelled) {
          setIsDataLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [
    currentUser,
    setAchievements,
    setApplications,
    setEvents,
    setNotifications,
  ]);

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
        console.warn("Failed to load HR public profile.", error);
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

  const refreshCurrentUser = useCallback(async () => {
    try {
      if (!hasBackendToken()) return;
      const profile = await backendGetProfile();
      setCurrentUser(profile);
    } catch (error) {
      console.warn("Failed to refresh user profile.", error);
    }
  }, []);

  const navigateAfterAuth = (user: AuthUser) => {
    if (user.role === "student") {
      setStudentView("home");
    } else if (user.role === "organizer") {
      setOrganizerView("events");
    } else {
      setHrView("home");
      setSelectedHrCandidateId(null);
      setSelectedHrProfileId(null);
    }
  };

  const handleRegister = async (
    payload: RegistrationPayload,
  ): Promise<string | null> => {
    try {
      const createdUser = await backendRegister(payload);
      setCurrentUser(createdUser);
      navigateAfterAuth(createdUser);
      return null;
    } catch (error) {
      const backendMessage = error instanceof Error ? error.message : "";
      if (backendMessage.toLowerCase().includes("already exists")) {
        return "Пользователь с таким email уже существует.";
      }
      console.warn("Backend registration failed.", error);
      return "Не удалось зарегистрироваться. Проверьте данные и повторите попытку.";
    }
  };

  const handleLogin = async (payload: LoginPayload): Promise<string | null> => {
    try {
      const user = await backendLogin(payload);
      setCurrentUser(user);
      navigateAfterAuth(user);
      return null;
    } catch (error) {
      console.warn("Backend login failed.", error);
      return "Не удалось войти. Проверьте email и пароль.";
    }
  };

  const handleUpdateEmail = async (
    newEmail: string,
    _currentPassword: string,
  ): Promise<string | null> => {
    if (!currentUser) return "Пользователь не найден.";
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return "Введите корректный email.";
    }

    try {
      if (currentUser.role === "student") {
        const updated = await updateStudentProfile({ email: normalizedEmail });
        setCurrentUser(updated);
      } else if (currentUser.role === "organizer") {
        const updated = await updateOrganizerProfile({
          email: normalizedEmail,
        });
        setCurrentUser(updated);
      } else {
        return "Обновление email пока доступно только студенту и организатору.";
      }
      return null;
    } catch (error) {
      console.warn("Failed to update email.", error);
      return "Не удалось обновить email. Попробуйте позже.";
    }
  };

  const handleUpdatePhone = async (phone: string): Promise<string | null> => {
    if (!currentUser) return "Пользователь не найден.";
    try {
      if (currentUser.role === "student") {
        const updated = await updateStudentProfile({
          phone: phone || null,
        });
        setCurrentUser(updated);
      } else if (currentUser.role === "organizer") {
        const updated = await updateOrganizerProfile({
          phone: phone || null,
        });
        setCurrentUser(updated);
      } else {
        return "Обновление телефона пока доступно только студенту и организатору.";
      }
      return null;
    } catch (error) {
      console.warn("Failed to update phone.", error);
      return "Не удалось обновить телефон. Попробуйте позже.";
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<string | null> => {
    if (!currentUser) return "Пользователь не найден.";
    if (newPassword.length < 8) {
      return "Новый пароль должен содержать минимум 8 символов.";
    }

    try {
      await backendChangePassword({
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      });
      return null;
    } catch (error) {
      console.warn("Failed to update password.", error);
      return "Не удалось обновить пароль. Проверьте текущий пароль.";
    }
  };

  const handleUpdateNotifications = (settings: NotificationSettings) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      notifications: {
        invitations: Boolean(settings.invitations),
        verification: Boolean(settings.verification),
        recommendations: Boolean(settings.recommendations),
      },
    });
  };

  const handleUpdateOrganizerNotifications = (
    settings: OrganizerNotificationSettings,
  ) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      organizerNotifications: normalizeOrganizerNotifications(settings),
    });
  };

  const handleUpdatePublicProfile = async (publicProfile: PublicProfile) => {
    if (!currentUser || currentUser.role !== "student") return;
    try {
      const updated = await updateStudentProfile({
        firstName: publicProfile.firstName,
        lastName: publicProfile.lastName,
        middleName: publicProfile.middleName ?? null,
        university: publicProfile.university,
        faculty: publicProfile.faculty,
        course: publicProfile.course,
        city: publicProfile.city,
        bio: publicProfile.bio,
        avatarUrl: publicProfile.avatarUrl ?? null,
        socialLinks: {
          telegram: publicProfile.socialLinks.telegram,
          github: publicProfile.socialLinks.github,
          linkedin: publicProfile.socialLinks.linkedin,
          website: publicProfile.socialLinks.website,
        },
        visibleAchievementIds: publicProfile.visibleAchievementIds,
        visibleBadgeIds: publicProfile.visibleBadgeIds,
      });
      setCurrentUser(updated);
    } catch (error) {
      console.warn("Failed to update public profile.", error);
    }
  };

  const handleUpdateOrganizerProfile = async (
    organizerProfile: OrganizerOrganizationProfile,
  ) => {
    if (!currentUser || currentUser.role !== "organizer") return;
    try {
      const updated = await updateOrganizerProfile({
        organizationName: organizerProfile.organizationName,
        shortName: organizerProfile.shortName,
        organizationType: organizerProfile.organizationType,
        website: organizerProfile.website,
        description: organizerProfile.description,
        contactEmail: organizerProfile.contactEmail,
        contactPhone: organizerProfile.contactPhone ?? null,
        logoUrl: organizerProfile.logoUrl ?? null,
        foundedYear: organizerProfile.foundedYear ?? null,
        socialLinks: {
          telegram: organizerProfile.socialLinks.telegram,
          vk: organizerProfile.socialLinks.vk,
          youtube: organizerProfile.socialLinks.youtube,
        },
      });
      setCurrentUser(updated);
    } catch (error) {
      console.warn("Failed to update organizer profile.", error);
    }
  };

  const handleDeleteAccount = (confirmationText: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    if (confirmationText !== "УДАЛИТЬ") {
      return "Введите УДАЛИТЬ для подтверждения удаления аккаунта.";
    }

    clearBackendToken();
    setEvents([]);
    setAchievements([]);
    setNotifications([]);
    setApplications([]);
    setStudentInvitationsState([]);
    setStudentSubscribersState([]);
    setStudentAppliedEventIds([]);

    setCurrentUser(null);
    setStudentView("home");
    setOrganizerView("events");
    setHrView("home");
    setSelectedHrCandidateId(null);
    setSelectedHrProfileId(null);
    setStudentSubscribersReturnView("home");
    return null;
  };

  const handleLogout = () => {
    clearBackendToken();
    setEvents([]);
    setAchievements([]);
    setNotifications([]);
    setApplications([]);
    setStudentInvitationsState([]);
    setStudentSubscribersState([]);
    setStudentAppliedEventIds([]);
    setCurrentUser(null);
    setStudentView("home");
    setOrganizerView("events");
    setHrView("home");
    setSelectedHrCandidateId(null);
    setSelectedHrProfileId(null);
    setStudentSubscribersReturnView("home");
  };

  // ── Student: filter only this student's achievements ──────────────────────
  const studentAchievements =
    currentUser?.role === "student"
      ? achievements.filter((a) => a.studentId === currentUser.id)
      : [];

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

  const publicStats = calculateStudentMetrics(studentAchievements);
  const studentBadges = buildBadgeViewModels(studentAchievements);
  const unlockedBadgeIds = useMemo(
    () =>
      new Set(
        studentBadges
          .filter((badge) => badge.unlocked)
          .map((badge) => badge.id),
      ),
    [studentBadges],
  );
  const { organizerVisibleEvents, organizerComputedStats } = useOrganizerEvents(
    events,
    achievements,
    role,
    currentUser,
  );

  const currentUserNotifications: AppNotification[] = currentUser
    ? notifications.filter((item) => item.userId === currentUser.id)
    : [];
  const handleMarkNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!currentUser) return;

      try {
        await markNotificationRead(notificationId);
        const refreshed = await fetchNotifications(currentUser.id);
        setNotifications(refreshed);
      } catch (error) {
        console.warn("Failed to mark notification as read.", error);
      }
    },
    [currentUser, setNotifications],
  );
  const handleMarkAllNotificationsRead = useCallback(() => {
    if (!currentUser) return;

    const run = async () => {
      try {
        await markAllNotificationsRead();
        const refreshed = await fetchNotifications(currentUser.id);
        setNotifications(refreshed);
      } catch (error) {
        console.warn("Failed to mark notifications as read.", error);
      }
    };

    run();
  }, [currentUser, setNotifications]);
  const studentAchievementNotifications =
    currentUser?.role === "student"
      ? currentUserNotifications.filter((item) => item.type === "achievement")
      : [];

  const studentSubscribers: SubscriberPreviewItem[] = useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return [];
    return studentSubscribersState;
  }, [currentUser, studentSubscribersState]);

  const studentInvitations = useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return [];
    return studentInvitationsState;
  }, [currentUser, studentInvitationsState]);

  const hrTopByAchievements = useMemo(
    () => hrHomeSummary.topByAchievements,
    [hrHomeSummary],
  );

  const hrTopBySubscribers = useMemo(
    () => hrHomeSummary.topBySubscribers,
    [hrHomeSummary],
  );

  const hrHomeNotifications = useMemo(() => {
    if (!currentUser || currentUser.role !== "hr") return [];

    return [...currentUserNotifications]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 8);
  }, [currentUser, currentUserNotifications]);

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

  const hrPublishedEventsCount = events.filter(
    (item) => item.status === "published",
  ).length;

  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") {
      setVisibilitySeededForUserId(null);
      return;
    }

    if (visibilitySeededForUserId === currentUser.id) return;

    const profile = currentUser.publicProfile;
    if (profile.visibleAchievementIds.length > 0) {
      setVisibilitySeededForUserId(currentUser.id);
      return;
    }

    if (studentAchievements.length === 0) {
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
  }, [currentUser, studentAchievements, visibilitySeededForUserId]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "student") return;

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
  }, [currentUser, unlockedBadgeIds]);

  const notifyCandidateSubscribers = useCallback(
    (
      _candidateId: string,
      _title: string,
      _description: string,
      _options?: {
        skipHrId?: string;
        markAsAchievementUpdate?: boolean;
      },
    ) => {
      // Placeholder for backend-driven notifications.
    },
    [],
  );

  // ── Organizer: CRUD ────────────────────────────────────────────────────────
  const handleCreateEvent = async (data: EventFormPayload) => {
    if (!currentUser || currentUser.role !== "organizer") return;
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
    if (!selectedEventId || !currentUser) return;
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

  const handleOpenStudentEvent = (
    id: string,
    returnView: "home" | "achievements" | "events",
  ) => {
    setSelectedEventId(id);
    setStudentEventReturnView(returnView);
    setStudentView("event-details");
  };

  const handleOpenHrEvent = (id: string) => {
    setSelectedEventId(id);
    setHrView("event-details");
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

  const handleUpdateHrDefaultInviteComment = async (comment: string) => {
    if (!currentUser || currentUser.role !== "hr") return;
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
    if (!currentUser || currentUser.role !== "hr") return;
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

  const handleMoveHrCandidateStatus = (
    candidateId: string,
    toStatus: HrFunnelStatus,
    note?: string,
  ): string | null => {
    if (!currentUser || currentUser.role !== "hr") {
      return "Операция доступна только для HR.";
    }

    const currentStatus = getCandidateStatusById(candidateId);

    if (currentStatus === toStatus) {
      return null;
    }

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
  };

  const handleAddCandidateToFunnel = (candidateId: string): string | null => {
    if (!currentUser || currentUser.role !== "hr") {
      return "Добавление в воронку доступно только для HR.";
    }

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
    if (!currentUser || currentUser.role !== "hr") {
      return "Архивирование доступно только для HR.";
    }

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
    if (!currentUser || currentUser.role !== "hr") {
      return "Приглашение доступно только для HR.";
    }

    const candidate =
      hrCandidates.find((item) => item.id === candidateId) ?? null;
    if (!candidate) {
      return "Кандидат не выбран.";
    }

    if (!payload.message.trim()) {
      return "Комментарий к приглашению обязателен.";
    }

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
    if (moveError) {
      return moveError;
    }

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

  const handleToggleHrCandidateSubscription = () => {
    if (!currentUser || currentUser.role !== "hr") return;
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

  const handleStudentInvitationResponse = (
    invitationId: string,
    response: "accepted" | "rejected",
  ): string | null => {
    if (!currentUser || currentUser.role !== "student") {
      return "Ответ доступен только студенту.";
    }

    const run = async () => {
      try {
        const updatedInvitation = await respondToStudentInvitation(
          invitationId,
          response,
          currentUser.id,
        );
        setStudentInvitationsState((prev) =>
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
  };

  const handleOpenAchievement = (achievementId: string) => {
    setSelectedAchievementId(achievementId);
  };

  const handleToggleAchievementVisibility = async (
    achievementId: string,
    nextVisible: boolean,
  ) => {
    if (!currentUser || currentUser.role !== "student") return;

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
  };

  const handleToggleBadgeVisibility = async (badgeId: string) => {
    if (!currentUser || currentUser.role !== "student") return;

    const profile = currentUser.publicProfile;
    const currentSet = new Set(
      profile.visibleBadgeIds.filter((id) => unlockedBadgeIds.has(id)),
    );
    const wasVisible = currentSet.has(badgeId);
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

    if (!wasVisible) {
      const badgeTitle =
        studentBadges.find((badge) => badge.id === badgeId)?.title ?? "значок";
      notifyCandidateSubscribers(
        currentUser.id,
        "Кандидат открыл значок",
        `${currentUser.name} открыл для просмотра значок «${badgeTitle}».`,
      );
    }
  };

  const handlePublishResults = async (
    eventId: string,
    participants: Participant[],
  ) => {
    if (!currentUser || currentUser.role !== "organizer") return;
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

  const handleToggleApplication = async (eventId: string) => {
    if (!currentUser || currentUser.role !== "student") return;
    const isApplied = studentAppliedEventIds.includes(eventId);

    try {
      if (isApplied) {
        await unregisterStudentForEvent(eventId);
        setStudentAppliedEventIds((prev) =>
          prev.filter((id) => id !== eventId),
        );
      } else {
        await registerStudentForEvent(eventId);
        setStudentAppliedEventIds((prev) => [...prev, eventId]);
      }
    } catch (error) {
      console.warn("Failed to update event application.", error);
    }
  };

  const handleOpenHrCandidateProfile = useCallback(
    (
      candidateId: string,
      backView: "home" | "dashboards" | "candidates-search",
    ) => {
      if (!currentUser || currentUser.role !== "hr") return;

      const run = async () => {
        try {
          const details = await fetchHrCandidateDetails(candidateId);
          const subscribers = details.subscribers.reduce<
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
            acc.push({
              id,
              name,
              email: item.email ?? "",
            });
            return acc;
          }, []);
          setSelectedHrCandidateData({
            candidate: details.candidate,
            achievements: details.achievements,
            status: details.status,
            statusHistory: details.statusHistory,
            note: details.note,
            subscribers,
            isCurrentHrSubscribed: subscribers.some(
              (item) => item.id === currentUser.id,
            ),
          });
        } catch (error) {
          console.warn("Failed to load HR candidate details.", error);
          setSelectedHrCandidateData(null);
        }
      };

      run();
      setSelectedHrCandidateId(candidateId);
      setSelectedHrProfileId(null);
      setHrCandidateBackView(backView);
      setHrView("candidate-profile");
    },
    [currentUser],
  );

  useEffect(() => {
    if (!currentUser || currentUser.role !== "organizer") {
      setApplications([]);
      return;
    }
    if (!selectedEventId) {
      setApplications([]);
      return;
    }

    let cancelled = false;
    const loadParticipants = async () => {
      try {
        const items = await fetchOrganizerEventParticipants(selectedEventId);
        if (!cancelled) {
          setApplications(items);
        }
      } catch (error) {
        if (!cancelled) {
          setApplications([]);
        }
        console.warn("Failed to load event participants.", error);
      }
    };

    loadParticipants();

    return () => {
      cancelled = true;
    };
  }, [currentUser, selectedEventId, setApplications]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedAchievement = selectedAchievementId
    ? (achievements.find((item) => item.id === selectedAchievementId) ?? null)
    : null;
  const selectedAchievementEvent = selectedAchievement?.eventId
    ? events.find((item) => item.id === selectedAchievement.eventId)
    : undefined;
  const selectedEventApplications: EventApplication[] = selectedEventId
    ? applications.filter((item) => item.eventId === selectedEventId)
    : [];
  const isCurrentStudentApplied =
    currentUser?.role === "student" && selectedEventId
      ? studentAppliedEventIds.includes(selectedEventId)
      : false;

  const organizerOptions = useMemo(() => {
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

  const organizerVerificationRequests =
    currentUser?.role === "organizer" ? achievements : [];

  const handleReviewRequest = (
    achievementId: string,
    decision: "Подтверждено" | "Отклонено",
    comment?: string,
  ) => {
    if (!currentUser || currentUser.role !== "organizer") return;

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
    if (!selectedEvent?.organizerId) {
      setSelectedEventOrganizerInfo(null);
      return;
    }

    let cancelled = false;
    const loadOrganizer = async () => {
      try {
        const profile = await fetchPublicOrganizerProfile(
          selectedEvent.organizerId,
        );
        if (!cancelled) {
          setSelectedEventOrganizerInfo(profile);
        }
      } catch (error) {
        if (!cancelled) {
          setSelectedEventOrganizerInfo(null);
        }
        console.warn("Failed to load organizer profile.", error);
      }
    };

    loadOrganizer();

    return () => {
      cancelled = true;
    };
  }, [selectedEvent?.organizerId]);

  if (!isAuthResolved) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!currentUser) {
    return <RegisterForm onRegister={handleRegister} onLogin={handleLogin} />;
  }

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

  const isStudentRole = role === "student";

  return (
    <div
      className={cn(
        "relative flex h-screen overflow-hidden",
        isStudentRole
          ? "bg-[radial-gradient(circle_at_12%_14%,rgba(255,177,215,0.52),transparent_33%),radial-gradient(circle_at_84%_18%,rgba(156,231,255,0.55),transparent_37%),radial-gradient(circle_at_82%_80%,rgba(188,255,216,0.5),transparent_36%),linear-gradient(135deg,#edf5ff_0%,#ebf9f0_44%,#ebefff_100%)]"
          : "bg-background",
      )}>
      {isStudentRole && (
        <>
          <div className="student-float-slow pointer-events-none absolute -left-28 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0)_70%)]" />
          <div className="student-float-fast pointer-events-none absolute right-10 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0)_72%)]" />
          <div className="student-float-slow pointer-events-none absolute bottom-[-90px] left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0)_70%)]" />
        </>
      )}
      <Sidebar
        role={role}
        studentView={studentView}
        organizerView={organizerView}
        hrView={hrView}
        onStudentViewChange={(view) => {
          if (view === "events") {
            setStudentEventsTab("table");
          }
          setStudentView(view);
        }}
        onOrganizerViewChange={setOrganizerView}
        onHrViewChange={setHrView}
      />
      <TopBar
        role={role}
        user={currentUser}
        notifications={currentUserNotifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onLogout={handleLogout}
      />

      <main
        className={cn(
          "ml-64 mt-16 flex-1 overflow-auto",
          isStudentRole &&
            "relative border-l border-white/35 bg-white/18 backdrop-blur-[1.5px]",
        )}>
        <div className={cn("p-8", isStudentRole && "relative z-10")}>
          {role === "student" && (
            <>
              {studentView === "home" && (
                <HomePage
                  achievements={studentAchievements}
                  recommendedEvents={recommendedStudentEvents}
                  user={currentUser}
                  subscribers={studentSubscribers}
                  onOpenSubscribers={() => {
                    setSelectedHrProfileId(null);
                    setStudentSubscribersReturnView("home");
                    setStudentView("subscribers");
                  }}
                  onOpenEvent={(eventId) =>
                    handleOpenStudentEvent(eventId, "home")
                  }
                  onOpenAchievement={handleOpenAchievement}
                  onOpenRecommendedEvents={() => {
                    setStudentEventsTab("recommended");
                    setStudentView("events");
                  }}
                />
              )}
              {studentView === "events" && (
                <StudentEventsPage
                  events={availableStudentEvents}
                  recommendedEvents={recommendedStudentEvents}
                  activeTab={studentEventsTab}
                  onTabChange={setStudentEventsTab}
                  onOpenEvent={(eventId) =>
                    handleOpenStudentEvent(eventId, "events")
                  }
                />
              )}
              {studentView === "dashboards" && (
                <DashboardsPage achievements={studentAchievements} />
              )}
              {studentView === "achievements" && (
                <AchievementsPage
                  achievements={studentAchievements}
                  events={events}
                  onOpenEvent={(eventId) =>
                    handleOpenStudentEvent(eventId, "achievements")
                  }
                  onOpenAchievement={handleOpenAchievement}
                  onCreateAchievement={() =>
                    setStudentView("create-achievement")
                  }
                  achievementNotifications={studentAchievementNotifications}
                  visibleBadgeIds={currentUser.publicProfile.visibleBadgeIds.filter(
                    (id) => unlockedBadgeIds.has(id),
                  )}
                  onToggleBadgeVisibility={handleToggleBadgeVisibility}
                />
              )}
              {studentView === "invitations" && (
                <StudentInvitationsPage
                  invitations={studentInvitations}
                  onRespond={handleStudentInvitationResponse}
                />
              )}
              {studentView === "create-achievement" && (
                <AchievementRequestForm
                  organizerOptions={organizerOptions}
                  events={events}
                  onBack={() => setStudentView("achievements")}
                  onSubmit={(payload) => {
                    if (!currentUser || currentUser.role !== "student") return;

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const achievementDate = new Date(
                      `${payload.date}T00:00:00`,
                    );
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
                        descriptionParts.push(
                          `Локация: ${payload.newEvent.location}`,
                        );
                      }
                      if (payload.newEvent.registrationDeadline) {
                        descriptionParts.push(
                          `Дедлайн регистрации: ${payload.newEvent.registrationDeadline}`,
                        );
                      }
                      if (payload.newEvent.website) {
                        descriptionParts.push(
                          `Сайт: ${payload.newEvent.website}`,
                        );
                      }
                      if (payload.newEvent.contactEmail) {
                        descriptionParts.push(
                          `Контакт: ${payload.newEvent.contactEmail}`,
                        );
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
                          eventId: payload.eventNotInList
                            ? undefined
                            : payload.eventId,
                          organizerName: payload.eventNotInList
                            ? selectedOrganizer?.label || ""
                            : undefined,
                          description: descriptionParts.join("\n"),
                        });

                        const refreshed = await fetchStudentAchievements(
                          currentUser.id,
                        );
                        setAchievements(refreshed);

                        const profile = currentUser.publicProfile;
                        if (
                          !profile.visibleAchievementIds.includes(created.id)
                        ) {
                          const nextVisible = [
                            created.id,
                            ...profile.visibleAchievementIds,
                          ].slice(0, 10);
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
                  }}
                />
              )}
              {studentView === "event-details" && selectedEvent && (
                <EventDetailsPage
                  event={selectedEvent}
                  organizerInfo={eventOrganizerInfo}
                  role="student"
                  applications={selectedEventApplications}
                  isApplied={isCurrentStudentApplied}
                  onToggleApplication={() =>
                    handleToggleApplication(selectedEvent.id)
                  }
                  onBack={() => {
                    setSelectedEventId(null);
                    setStudentView(studentEventReturnView);
                  }}
                />
              )}
              {studentView === "profile" && (
                <ProfilePage
                  user={currentUser}
                  achievements={studentAchievements}
                  badges={studentBadges}
                  subscribers={studentSubscribers}
                  onOpenSubscribers={() => {
                    setSelectedHrProfileId(null);
                    setStudentSubscribersReturnView("profile");
                    setStudentView("subscribers");
                  }}
                  publicStats={publicStats}
                  onUpdateEmail={handleUpdateEmail}
                  onUpdatePhone={handleUpdatePhone}
                  onChangePassword={handleChangePassword}
                  onUpdateNotifications={handleUpdateNotifications}
                  onUpdatePublicProfile={handleUpdatePublicProfile}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
              {studentView === "subscribers" && (
                <SubscribersPage
                  title="Мои подписчики"
                  subtitle="HR, которые следят за вашим профилем"
                  subscribers={studentSubscribers}
                  onBack={() => setStudentView(studentSubscribersReturnView)}
                  onOpenSubscriber={(hrId) => {
                    setSelectedHrProfileId(hrId);
                    setStudentView("hr-profile");
                  }}
                />
              )}
              {studentView === "hr-profile" && (
                <HrPublicProfilePage
                  hrUser={selectedHrProfileUser}
                  onBack={() => setStudentView("subscribers")}
                />
              )}
            </>
          )}

          {role === "organizer" && (
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
                  onUpdateEmail={handleUpdateEmail}
                  onUpdatePhone={handleUpdatePhone}
                  onChangePassword={handleChangePassword}
                  onUpdateNotifications={handleUpdateOrganizerNotifications}
                  onUpdateOrganizationProfile={handleUpdateOrganizerProfile}
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
          )}

          {role === "hr" && (
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
                  onArchiveCandidate={(candidateId) =>
                    handleArchiveHrCandidate(candidateId)
                  }
                />
              )}

              {hrView === "candidates-search" && (
                <HrCandidatesSearchPage
                  candidates={hrCandidates}
                  onAddToFunnel={(candidateId) =>
                    handleAddCandidateToFunnel(candidateId)
                  }
                  onOpenCandidate={(candidateId) =>
                    handleOpenHrCandidateProfile(
                      candidateId,
                      "candidates-search",
                    )
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
                  isCurrentHrSubscribed={
                    isSelectedCandidateSubscribedByCurrentHr
                  }
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
                      selectedHrCandidateId
                        ? "candidate-profile"
                        : "candidates-search",
                    );
                  }}
                />
              )}

              {hrView === "profile" && (
                <OrganizerProfilePage
                  user={currentUser}
                  organizationStats={organizerComputedStats}
                  onUpdateEmail={handleUpdateEmail}
                  onUpdatePhone={handleUpdatePhone}
                  onChangePassword={handleChangePassword}
                  onUpdateNotifications={handleUpdateOrganizerNotifications}
                  onUpdateOrganizationProfile={handleUpdateOrganizerProfile}
                  hrDefaultInviteComment={hrDefaultInviteComment}
                  hrActionConfirmSettings={hrActionConfirmSettings}
                  onUpdateHrDefaultInviteComment={
                    handleUpdateHrDefaultInviteComment
                  }
                  onUpdateHrActionConfirmSettings={
                    handleUpdateHrActionConfirmSettings
                  }
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
            </>
          )}
        </div>
      </main>

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
    </div>
  );
}

export default function App() {
  return (
    <EventsStoreProvider>
      <AchievementsStoreProvider>
        <NotificationsStoreProvider>
          <AppContent />
        </NotificationsStoreProvider>
      </AchievementsStoreProvider>
    </EventsStoreProvider>
  );
}
