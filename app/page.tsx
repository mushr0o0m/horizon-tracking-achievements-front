"use client";

import { useEffect, useMemo, useState } from "react";
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
  AchievementLevel,
} from "@/lib/types";
import { calculateStudentMetrics } from "@/lib/metrics";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { HomePage } from "@/components/home-page";
import { DashboardsPage } from "@/components/dashboards-page";
import { AchievementsPage } from "@/components/achievements-page";
import { OrganizerEvents } from "@/components/organizer-events";
import { EventForm } from "@/components/event-form";
import { UploadResults } from "@/components/upload-results";
import { ProfilePage } from "@/components/profile-page";
import { OrganizerProfilePage } from "@/components/organizer-profile-page";
import { EventDetailsPage } from "@/components/event-details-page";
import { AchievementRequestForm } from "@/components/achievement-request-form";
import { VerificationRequestsPage } from "@/components/verification-requests-page";
import { AchievementDetailsModal } from "@/components/achievement-details-modal";
import {
  LoginPayload,
  RegisterForm,
  RegistrationPayload,
} from "@/components/register-form";
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

const AUTH_USERS_KEY = "hta.auth.users";
const AUTH_SESSION_KEY = "hta.auth.session";

interface StoredAccount {
  email: string;
  password: string;
  user: AuthUser;
}

interface LegacyStoredAccount {
  email?: unknown;
  password?: unknown;
  user?: unknown;
  student?: unknown;
}

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
  const role: UserRole = maybe.role === "organizer" ? "organizer" : "student";
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
      role === "organizer"
        ? normalizeOrganizerProfile(
            (maybe as { organizerProfile?: unknown }).organizerProfile,
            name,
            email,
          )
        : undefined,
    organizerNotifications:
      role === "organizer"
        ? normalizeOrganizerNotifications(
            (maybe as { organizerNotifications?: unknown })
              .organizerNotifications,
          )
        : undefined,
  };
}

function parseStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry): StoredAccount | null => {
        const maybeEntry = entry as LegacyStoredAccount;
        const rawUser = maybeEntry.user ?? maybeEntry.student;
        const normalizedUser = normalizeUser(rawUser);
        const email =
          typeof maybeEntry.email === "string"
            ? maybeEntry.email.trim().toLowerCase()
            : (normalizedUser?.email ?? "");
        const password =
          typeof maybeEntry.password === "string" ? maybeEntry.password : "";

        if (!normalizedUser || !email || !password) {
          return null;
        }

        return {
          email,
          password,
          user: normalizedUser,
        };
      })
      .filter((entry): entry is StoredAccount => entry !== null);
  } catch {
    return [];
  }
}

function parseStoredSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

function AppContent() {
  // Shared state — both roles read/write these
  const {
    events,
    applications,
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
    addAchievements,
    removeStudentAchievements,
    createAchievementRequest,
    reviewAchievementRequest,
    addSimulatedAchievement,
  } = useAchievementsStore();
  const { notifications, addNotification, markRead, markAllRead } =
    useNotificationsStore();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  // Role & navigation state
  const [studentView, setStudentView] = useState<StudentView>("home");
  const [organizerView, setOrganizerView] = useState<OrganizerView>("events");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedAchievementId, setSelectedAchievementId] = useState<
    string | null
  >(null);
  const [visibilitySeededForUserId, setVisibilitySeededForUserId] = useState<
    string | null
  >(null);
  const [studentEventReturnView, setStudentEventReturnView] = useState<
    "home" | "achievements"
  >("home");
  const [organizerAccountOptions, setOrganizerAccountOptions] = useState<
    Array<{ id: string; label: string; email: string }>
  >([]);

  const role: UserRole = currentUser?.role ?? "student";

  useEffect(() => {
    setCurrentUser(parseStoredSession());
    setIsAuthResolved(true);
  }, []);

  useEffect(() => {
    if (!isAuthResolved) return;

    const options = parseStoredAccounts()
      .filter((account) => account.user.role === "organizer")
      .map((account) => ({
        id: account.user.id,
        label:
          account.user.organizerProfile?.organizationName || account.user.name,
        email: account.user.email,
      }));

    setOrganizerAccountOptions(options);
  }, [isAuthResolved, currentUser]);

  const persistUserInStorage = (
    updatedUser: AuthUser,
    updatedPassword?: string,
  ) => {
    const accounts = parseStoredAccounts();
    const updatedAccounts = accounts.map((acc) => {
      if (acc.user.id !== updatedUser.id) return acc;

      return {
        ...acc,
        email: updatedUser.email,
        password: updatedPassword ?? acc.password,
        user: updatedUser,
      };
    });

    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedAccounts));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const handleRegister = (payload: RegistrationPayload): string | null => {
    const accounts = parseStoredAccounts();
    const duplicate = accounts.some(
      (acc) => acc.email === payload.email.toLowerCase(),
    );
    if (duplicate) {
      return "Пользователь с таким email уже существует.";
    }

    const userIdPrefix = payload.role === "organizer" ? "organizer" : "student";
    const createdUser: AuthUser = {
      id: `${userIdPrefix}-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      notifications: { ...DEFAULT_NOTIFICATIONS },
      publicProfile: buildDefaultPublicProfile(payload.name),
      organizerProfile:
        payload.role === "organizer"
          ? buildDefaultOrganizerProfile(payload.name, payload.email)
          : undefined,
      organizerNotifications:
        payload.role === "organizer"
          ? {
              ...DEFAULT_ORGANIZER_NOTIFICATIONS,
              deliveryChannels: [
                ...DEFAULT_ORGANIZER_NOTIFICATIONS.deliveryChannels,
              ],
            }
          : undefined,
    };

    const updatedAccounts: StoredAccount[] = [
      ...accounts,
      { email: payload.email, password: payload.password, user: createdUser },
    ];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedAccounts));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(createdUser));
    setCurrentUser(createdUser);
    if (createdUser.role === "student") {
      setStudentView("home");
    } else {
      setOrganizerView("events");
    }
    return null;
  };

  const handleLogin = (payload: LoginPayload): string | null => {
    const accounts = parseStoredAccounts();
    const normalizedEmail = payload.email.trim().toLowerCase();

    const account = accounts.find((item) => item.email === normalizedEmail);
    if (!account) {
      return "Аккаунт с таким email не найден.";
    }
    if (account.password !== payload.password) {
      return "Неверный пароль.";
    }

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(account.user));
    setCurrentUser(account.user);
    if (account.user.role === "student") {
      setStudentView("home");
    } else {
      setOrganizerView("events");
    }
    return null;
  };

  const handleUpdateEmail = (
    newEmail: string,
    currentPassword: string,
  ): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return "Введите корректный email.";
    }

    const accounts = parseStoredAccounts();
    const currentAccount = accounts.find(
      (acc) => acc.user.id === currentUser.id,
    );
    if (!currentAccount) {
      return "Аккаунт не найден в хранилище.";
    }

    if (currentAccount.password !== currentPassword) {
      return "Текущий пароль введен неверно.";
    }

    const duplicate = accounts.some(
      (acc) => acc.user.id !== currentUser.id && acc.email === normalizedEmail,
    );
    if (duplicate) {
      return "Этот email уже используется другим аккаунтом.";
    }

    persistUserInStorage({ ...currentUser, email: normalizedEmail });
    return null;
  };

  const handleUpdatePhone = (phone: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    persistUserInStorage({ ...currentUser, phone: phone || undefined });
    return null;
  };

  const handleChangePassword = (
    currentPassword: string,
    newPassword: string,
  ): string | null => {
    if (!currentUser) return "Пользователь не найден.";

    const accounts = parseStoredAccounts();
    const currentAccount = accounts.find(
      (acc) => acc.user.id === currentUser.id,
    );
    if (!currentAccount) {
      return "Аккаунт не найден в хранилище.";
    }

    if (currentAccount.password !== currentPassword) {
      return "Текущий пароль введен неверно.";
    }

    if (newPassword.length < 8) {
      return "Новый пароль должен содержать минимум 8 символов.";
    }

    persistUserInStorage(currentUser, newPassword);
    return null;
  };

  const handleUpdateNotifications = (notifications: NotificationSettings) => {
    if (!currentUser) return;
    persistUserInStorage({
      ...currentUser,
      notifications: {
        invitations: Boolean(notifications.invitations),
        verification: Boolean(notifications.verification),
        recommendations: Boolean(notifications.recommendations),
      },
    });
  };

  const handleUpdateOrganizerNotifications = (
    notifications: OrganizerNotificationSettings,
  ) => {
    if (!currentUser) return;
    persistUserInStorage({
      ...currentUser,
      organizerNotifications: normalizeOrganizerNotifications(notifications),
    });
  };

  const handleUpdatePublicProfile = (publicProfile: PublicProfile) => {
    if (!currentUser) return;
    persistUserInStorage({
      ...currentUser,
      publicProfile: normalizePublicProfile(publicProfile, currentUser.name),
    });
  };

  const handleUpdateOrganizerProfile = (
    organizerProfile: OrganizerOrganizationProfile,
  ) => {
    if (!currentUser) return;
    persistUserInStorage({
      ...currentUser,
      organizerProfile: normalizeOrganizerProfile(
        {
          ...organizerProfile,
          eventsCount: organizerComputedStats.eventsCount,
          totalParticipants: organizerComputedStats.totalParticipants,
        },
        currentUser.name,
        currentUser.email,
      ),
    });
  };

  const handleDeleteAccount = (confirmationText: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    if (confirmationText !== "УДАЛИТЬ") {
      return "Введите УДАЛИТЬ для подтверждения удаления аккаунта.";
    }

    const accounts = parseStoredAccounts();
    const updatedAccounts = accounts.filter(
      (acc) => acc.user.id !== currentUser.id,
    );
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedAccounts));
    localStorage.removeItem(AUTH_SESSION_KEY);

    if (currentUser.role === "student") {
      removeStudentAchievements(currentUser.id);
    }

    setCurrentUser(null);
    setStudentView("home");
    setOrganizerView("events");
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser(null);
    setStudentView("home");
    setOrganizerView("events");
  };

  // ── Student: filter only this student's achievements ──────────────────────
  const studentAchievements =
    currentUser?.role === "student"
      ? achievements.filter((a) => a.studentId === currentUser.id)
      : [];

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
  const studentAchievementNotifications =
    currentUser?.role === "student"
      ? currentUserNotifications.filter((item) => item.type === "achievement")
      : [];

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

    persistUserInStorage({
      ...currentUser,
      publicProfile: {
        ...profile,
        visibleAchievementIds: studentAchievements
          .slice(0, 10)
          .map((item) => item.id),
      },
    });
    setVisibilitySeededForUserId(currentUser.id);
  }, [
    currentUser,
    persistUserInStorage,
    studentAchievements,
    visibilitySeededForUserId,
  ]);

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

    persistUserInStorage({
      ...currentUser,
      publicProfile: {
        ...currentUser.publicProfile,
        visibleBadgeIds: normalizedIds,
      },
    });
  }, [currentUser, unlockedBadgeIds, persistUserInStorage]);

  // ── Demo: simulate publishing results for current student ─────────────────
  const handleSimulateResults = () => {
    if (!currentUser || currentUser.role !== "student") return;
    const levels: AchievementLevel[] = [
      "Международный",
      "Всероссийский",
      "Региональный",
    ];
    const eventTypes = [
      "Олимпиада",
      "Хакатон",
      "Конференция",
      "Чемпионат",
    ] as const;
    const results = ["1 место", "2 место", "3 место", "Призёр", "Медаль"];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const eventTypeMap = {
      Олимпиада: "olympiad",
      Хакатон: "hackathon",
      Конференция: "conference",
      Чемпионат: "other",
    } as const;
    const eventLevelMap = {
      Международный: "international",
      Всероссийский: "national",
      Региональный: "regional",
    } as const;

    const simulatedEvent = createEvent(
      {
        title: `Симулированное мероприятие (${type})`,
        type: eventTypeMap[type],
        level: eventLevelMap[level],
        dates: {
          start: new Date().toISOString().split("T")[0],
          end: new Date().toISOString().split("T")[0],
          registrationDeadline: new Date().toISOString().split("T")[0],
        },
        format: "online",
        location: "",
        description: "Симуляция публикации результатов",
        website: "",
        contactEmail: "events@horizon.local",
        logoUrl: "",
        bannerUrl: "",
        status: "published",
        customFields: [],
      },
      "organizer-demo",
    );

    const created = addSimulatedAchievement({
      eventId: simulatedEvent.id,
      title: `Симулированное мероприятие (${type})`,
      level,
      date: new Date().toISOString().split("T")[0],
      result: results[Math.floor(Math.random() * results.length)],
      studentId: currentUser.id,
      eventType: type,
    });

    const profile = currentUser.publicProfile;
    if (!profile.visibleAchievementIds.includes(created.id)) {
      const nextVisible = [created.id, ...profile.visibleAchievementIds];
      persistUserInStorage({
        ...currentUser,
        publicProfile: {
          ...profile,
          visibleAchievementIds: nextVisible.slice(0, 10),
        },
      });
    }
  };

  // ── Organizer: CRUD ────────────────────────────────────────────────────────
  const handleCreateEvent = (data: EventFormPayload) => {
    if (!currentUser || currentUser.role !== "organizer") return;
    createEvent(data, currentUser.id);
    setOrganizerView("events");
  };

  const handleEditEvent = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("edit-event");
  };

  const handleSaveEdit = (data: EventFormPayload) => {
    if (!selectedEventId) return;
    updateEvent(selectedEventId, data);
    setSelectedEventId(null);
    setOrganizerView("events");
  };

  const handleDeleteEvent = (id: string) => {
    deleteEvent(id);
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
    returnView: "home" | "achievements",
  ) => {
    setSelectedEventId(id);
    setStudentEventReturnView(returnView);
    setStudentView("event-details");
  };

  const handleOpenAchievement = (achievementId: string) => {
    setSelectedAchievementId(achievementId);
  };

  const handleToggleAchievementVisibility = (
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

    persistUserInStorage({
      ...currentUser,
      publicProfile: {
        ...profile,
        visibleAchievementIds: nextIds,
      },
    });
  };

  const handleToggleBadgeVisibility = (badgeId: string) => {
    if (!currentUser || currentUser.role !== "student") return;

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

    persistUserInStorage({
      ...currentUser,
      publicProfile: {
        ...profile,
        visibleBadgeIds: nextIds,
      },
    });
  };

  const handlePublishResults = (
    eventId: string,
    participants: Participant[],
  ) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const newAchievements: Achievement[] = participants.map((p) => ({
      id: `ach-${Date.now()}-${p.id}`,
      title: event.title,
      level: EVENT_LEVEL_TO_ACHIEVEMENT_LEVEL[event.level],
      date: event.dates.end || event.dates.start,
      result: p.result,
      status: "Подтверждено" as const,
      studentId: p.studentId,
      studentName: p.studentName,
      eventId: event.id,
      eventType: EVENT_TYPE_TO_ACHIEVEMENT_TYPE[event.type],
      source: "organizer" as const,
    }));
    addAchievements(newAchievements);
    participants.forEach((participant) => {
      addNotification(
        participant.studentId,
        "Достижение подтверждено организатором",
        `По мероприятию ${event.title} добавлен результат: ${participant.result}`,
        "achievement",
      );
    });
    applyResults(eventId);
    setSelectedEventId(null);
    setOrganizerView("events");
  };

  const handleToggleApplication = (eventId: string) => {
    if (!currentUser || currentUser.role !== "student") return;
    toggleApplication(eventId, currentUser.id, currentUser.name);
  };

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
      ? applications.some(
          (item) =>
            item.eventId === selectedEventId &&
            item.studentId === currentUser.id,
        )
      : false;

  const organizerOptions = useMemo(() => {
    const map = new Map<string, { label: string; email: string }>();

    organizerAccountOptions.forEach((option) => {
      map.set(option.id, { label: option.label, email: option.email });
    });

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
  }, [events, organizerAccountOptions]);

  const organizerVerificationRequests =
    currentUser?.role === "organizer"
      ? achievements.filter(
          (achievement) =>
            achievement.status === "На проверке" &&
            achievement.requestedOrganizerId === currentUser.id,
        )
      : [];

  const handleReviewRequest = (
    achievementId: string,
    decision: "Подтверждено" | "Отклонено",
    comment?: string,
  ) => {
    const targetAchievement = achievements.find(
      (item) => item.id === achievementId,
    );
    reviewAchievementRequest(achievementId, decision, comment);

    if (
      decision === "Подтверждено" &&
      targetAchievement?.eventId &&
      targetAchievement.studentId
    ) {
      if (currentUser?.role === "organizer") {
        assignEventOrganizer(
          targetAchievement.eventId,
          currentUser.id,
          currentUser.email,
        );
      }

      ensureApplication(
        targetAchievement.eventId,
        targetAchievement.studentId,
        targetAchievement.studentName || targetAchievement.studentId,
      );
    }

    if (targetAchievement) {
      addNotification(
        targetAchievement.studentId,
        decision === "Подтверждено"
          ? "Запрос на достижение подтвержден"
          : "Запрос на достижение отклонен",
        comment?.trim()
          ? comment
          : decision === "Подтверждено"
            ? `Достижение ${targetAchievement.title} подтверждено.`
            : `Достижение ${targetAchievement.title} отклонено.`,
        "achievement",
      );
    }
  };

  if (!isAuthResolved) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!currentUser) {
    return <RegisterForm onRegister={handleRegister} onLogin={handleLogin} />;
  }

  const eventOrganizerAccount = selectedEvent
    ? parseStoredAccounts().find(
        (item) => item.user.id === selectedEvent.organizerId,
      )
    : null;
  const eventOrganizerInfo = selectedEvent
    ? {
        organizationName:
          eventOrganizerAccount?.user.organizerProfile?.organizationName ||
          eventOrganizerAccount?.user.name ||
          "Организатор",
        shortName:
          eventOrganizerAccount?.user.organizerProfile?.shortName || undefined,
        organizationType:
          eventOrganizerAccount?.user.organizerProfile?.organizationType ||
          undefined,
        description:
          eventOrganizerAccount?.user.organizerProfile?.description ||
          undefined,
        website:
          eventOrganizerAccount?.user.organizerProfile?.website || undefined,
        contactEmail:
          eventOrganizerAccount?.user.organizerProfile?.contactEmail ||
          selectedEvent.contactEmail,
        contactPhone:
          eventOrganizerAccount?.user.organizerProfile?.contactPhone ||
          undefined,
      }
    : undefined;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        role={role}
        studentView={studentView}
        organizerView={organizerView}
        onStudentViewChange={setStudentView}
        onOrganizerViewChange={setOrganizerView}
      />
      <TopBar
        role={role}
        user={currentUser}
        notifications={currentUserNotifications}
        onMarkNotificationRead={markRead}
        onMarkAllNotificationsRead={() => markAllRead(currentUser.id)}
        onLogout={handleLogout}
      />

      <main className="ml-64 mt-16 flex-1 overflow-auto">
        <div className="p-8">
          {role === "student" && (
            <>
              {studentView === "home" && (
                <HomePage
                  achievements={studentAchievements}
                  events={events}
                  user={currentUser}
                  onOpenEvent={(eventId) =>
                    handleOpenStudentEvent(eventId, "home")
                  }
                  onOpenAchievement={handleOpenAchievement}
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
                  onSimulateResult={handleSimulateResults}
                  achievementNotifications={studentAchievementNotifications}
                  visibleBadgeIds={currentUser.publicProfile.visibleBadgeIds.filter(
                    (id) => unlockedBadgeIds.has(id),
                  )}
                  onToggleBadgeVisibility={handleToggleBadgeVisibility}
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

                    const targetEvent = payload.eventNotInList
                      ? payload.newEvent
                        ? createEvent(
                            {
                              title: payload.newEvent.title,
                              type: ACHIEVEMENT_EVENT_TO_ORGANIZER_TYPE[
                                payload.eventType
                              ],
                              level:
                                ACHIEVEMENT_LEVEL_TO_ORGANIZER_LEVEL[
                                  payload.level
                                ],
                              dates: {
                                start: payload.date,
                                end: payload.date,
                                registrationDeadline:
                                  payload.newEvent.registrationDeadline ||
                                  payload.date,
                              },
                              format: payload.newEvent.format,
                              location: payload.newEvent.location ?? "",
                              description: payload.newEvent.description,
                              website: payload.newEvent.website ?? "",
                              contactEmail:
                                payload.newEvent.contactEmail ||
                                selectedOrganizer?.email ||
                                "events@horizon.local",
                              logoUrl: "",
                              bannerUrl: "",
                              status: "draft",
                              customFields: [],
                            },
                            payload.requestedOrganizerId,
                          )
                        : null
                      : (events.find((event) => event.id === payload.eventId) ??
                        null);

                    if (!targetEvent) {
                      addNotification(
                        currentUser.id,
                        "Ошибка запроса",
                        "Не удалось определить мероприятие для достижения.",
                        "system",
                      );
                      return;
                    }

                    const created = createAchievementRequest(
                      currentUser.id,
                      currentUser.name,
                      {
                        ...payload,
                        eventId: targetEvent.id,
                        title: payload.title || targetEvent.title,
                        eventType:
                          payload.eventType ||
                          EVENT_TYPE_TO_ACHIEVEMENT_TYPE[targetEvent.type],
                        eventNotInList: payload.eventNotInList,
                        requestComment: payload.requestComment,
                      },
                    );

                    const profile = currentUser.publicProfile;
                    const nextVisible = [
                      created.id,
                      ...profile.visibleAchievementIds,
                    ].slice(0, 10);
                    persistUserInStorage({
                      ...currentUser,
                      publicProfile: {
                        ...profile,
                        visibleAchievementIds: nextVisible,
                      },
                    });

                    addNotification(
                      payload.requestedOrganizerId,
                      "Новый запрос на подтверждение",
                      payload.eventNotInList
                        ? `${currentUser.name} отправил запрос на достижение ${payload.title}. Мероприятие добавлено вне списка.`
                        : `${currentUser.name} отправил запрос на достижение ${payload.title}`,
                      "achievement",
                    );
                    setStudentView("achievements");
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
                  publicStats={publicStats}
                  onUpdateEmail={handleUpdateEmail}
                  onUpdatePhone={handleUpdatePhone}
                  onChangePassword={handleChangePassword}
                  onUpdateNotifications={handleUpdateNotifications}
                  onUpdatePublicProfile={handleUpdatePublicProfile}
                  onDeleteAccount={handleDeleteAccount}
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
