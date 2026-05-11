import type {
  AuthUser,
  CourseOption,
  NotificationSettings,
  OrganizerNotificationSettings,
  OrganizerOrganizationProfile,
  PublicProfile,
  SocialLinks,
  UserRole,
} from "@/lib/types";
import type { LoginPayload, RegistrationPayload } from "@/components/register-form";

const AUTH_TOKEN_KEY = "hta.api.access-token";
const BACKEND_BOOTSTRAP_SYNC_KEY = "hta.backend.bootstrap.synced.v1";
const AUTH_USERS_KEY = "hta.auth.users";
const ACHIEVEMENTS_STORAGE_KEY = "hta.store.achievements";
const EVENTS_STORE_STORAGE_KEY = "hta.store.events";
const NOTIFICATIONS_STORAGE_KEY = "hta.store.notifications";
const HR_CANDIDATE_STATUS_STORAGE_KEY = "hta.store.hr.candidate-statuses";
const HR_RECENT_ACTIONS_STORAGE_KEY = "hta.store.hr.recent-actions";
const HR_STATUS_HISTORY_STORAGE_KEY = "hta.store.hr.status-history";
const HR_CANDIDATE_NOTES_STORAGE_KEY = "hta.store.hr.candidate-notes";
const HR_MANUAL_ARCHIVE_STORAGE_KEY = "hta.store.hr.manual-archive";
const HR_SUBSCRIPTIONS_STORAGE_KEY = "hta.store.hr.subscriptions";
const HR_INVITATIONS_STORAGE_KEY = "hta.store.hr.invitations";
const HR_DEFAULT_INVITE_COMMENT_KEY = "hta.store.hr.default-invite-comment";
const HR_ACTION_CONFIRM_SETTINGS_KEY = "hta.store.hr.action-confirm-settings";
const HR_CANDIDATE_ACHIEVEMENT_UPDATES_KEY =
  "hta.store.hr.candidate-achievement-updates";

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

const DEFAULT_ORGANIZER_NOTIFICATIONS: OrganizerNotificationSettings = {
  verificationRequests: true,
  newRegistrations: true,
  reports: true,
  deliveryChannels: ["interface", "email"],
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");

interface AuthResponseDto {
  accessToken: string;
  tokenType: string;
  userId: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface StudentProfileDto {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  phone?: string | null;
  university?: string | null;
  faculty?: string | null;
  course?: string | null;
  city?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  socialLinks?: Record<string, string> | null;
  profileViews30d?: number | null;
  visibleAchievementIds?: string[] | null;
  visibleBadgeIds?: string[] | null;
}

interface OrganizerProfileDto {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  phone?: string | null;
  organizationName?: string | null;
  shortName?: string | null;
  organizationType?: string | null;
  website?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  foundedYear?: number | null;
  socialLinks?: Record<string, string> | null;
  eventsCount?: number | null;
  totalParticipants?: number | null;
}

interface HrProfileDto {
  userId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  website?: string | null;
  description?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

interface MyProfileResponseDto {
  userId: string;
  email: string;
  role: string;
  student?: StudentProfileDto | null;
  organizer?: OrganizerProfileDto | null;
  hr?: HrProfileDto | null;
}

interface BootstrapPayload {
  accounts?: unknown;
  achievements?: unknown;
  eventsState?: unknown;
  notifications?: unknown;
  hr?: {
    candidateStatuses?: unknown;
    recentActions?: unknown;
    statusHistory?: unknown;
    candidateNotes?: unknown;
    manualArchive?: unknown;
    subscriptions?: unknown;
    invitations?: unknown;
    defaultInviteComment?: unknown;
    actionConfirmSettings?: unknown;
    candidateAchievementUpdates?: unknown;
  };
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearBackendToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function setToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function syncBackendBootstrapIfNeeded(force = false): Promise<void> {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_BACKEND_BOOTSTRAP === "false") return;
  if (!force && localStorage.getItem(BACKEND_BOOTSTRAP_SYNC_KEY) === "true") return;

  try {
    const payload = await request<BootstrapPayload>("/public/bootstrap");
    writeIfPresent(AUTH_USERS_KEY, payload.accounts);
    writeIfPresent(ACHIEVEMENTS_STORAGE_KEY, payload.achievements);
    writeIfPresent(EVENTS_STORE_STORAGE_KEY, payload.eventsState);
    writeIfPresent(NOTIFICATIONS_STORAGE_KEY, payload.notifications);
    if (payload.hr) {
      writeIfPresent(HR_CANDIDATE_STATUS_STORAGE_KEY, payload.hr.candidateStatuses);
      writeIfPresent(HR_RECENT_ACTIONS_STORAGE_KEY, payload.hr.recentActions);
      writeIfPresent(HR_STATUS_HISTORY_STORAGE_KEY, payload.hr.statusHistory);
      writeIfPresent(HR_CANDIDATE_NOTES_STORAGE_KEY, payload.hr.candidateNotes);
      writeIfPresent(HR_MANUAL_ARCHIVE_STORAGE_KEY, payload.hr.manualArchive);
      writeIfPresent(HR_SUBSCRIPTIONS_STORAGE_KEY, payload.hr.subscriptions);
      writeIfPresent(HR_INVITATIONS_STORAGE_KEY, payload.hr.invitations);
      writeIfPresent(HR_DEFAULT_INVITE_COMMENT_KEY, payload.hr.defaultInviteComment);
      writeIfPresent(HR_ACTION_CONFIRM_SETTINGS_KEY, payload.hr.actionConfirmSettings);
      writeIfPresent(
        HR_CANDIDATE_ACHIEVEMENT_UPDATES_KEY,
        payload.hr.candidateAchievementUpdates,
      );
    }
    localStorage.setItem(BACKEND_BOOTSTRAP_SYNC_KEY, "true");
  } catch (error) {
    // The UI keeps working in local demo mode if the backend is temporarily unavailable.
    console.warn("Backend bootstrap is unavailable; frontend fallback data will be used.", error);
  }
}

function writeIfPresent(key: string, value: unknown) {
  if (typeof value === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export async function backendLogin(payload: LoginPayload): Promise<AuthUser> {
  const auth = await request<AuthResponseDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(auth.accessToken);
  const profile = await request<MyProfileResponseDto>("/users/me");
  return mapMyProfile(profile);
}

export async function backendRegister(payload: RegistrationPayload): Promise<AuthUser> {
  const name = parseName(payload.name);
  const body = {
    firstName: name.firstName,
    lastName: name.lastName,
    middleName: name.middleName,
    email: payload.email,
    password: payload.password,
    role: backendRole(payload.role),
    university: payload.role === "student" ? "" : undefined,
    faculty: payload.role === "student" ? "" : undefined,
    course: payload.role === "student" ? "1" : undefined,
    organizationName: payload.role === "organizer" ? payload.name : undefined,
    shortName: payload.role === "organizer" ? payload.name : undefined,
    companyName: payload.role === "hr" ? payload.name : undefined,
  };

  const auth = await request<AuthResponseDto>("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  setToken(auth.accessToken);
  const profile = await request<MyProfileResponseDto>("/users/me");
  return mapMyProfile(profile);
}

function mapMyProfile(profile: MyProfileResponseDto): AuthUser {
  const role = frontendRole(profile.role);
  const source = profile.student ?? profile.organizer ?? profile.hr;
  const firstName = source?.firstName ?? "";
  const lastName = source?.lastName ?? "";
  const middleName = source?.middleName ?? "";
  const name = [firstName, lastName, middleName].filter(Boolean).join(" ").trim() || profile.email;

  return {
    id: profile.userId,
    name,
    email: profile.email,
    role,
    phone: source?.phone ?? undefined,
    notifications: { ...DEFAULT_NOTIFICATIONS },
    publicProfile: mapPublicProfile(profile.student, firstName, lastName, middleName),
    organizerProfile:
      role === "organizer"
        ? mapOrganizerProfile(profile.organizer, name, profile.email)
        : role === "hr"
          ? mapHrAsOrganizerProfile(profile.hr, name, profile.email)
          : undefined,
    organizerNotifications:
      role === "organizer" || role === "hr"
        ? { ...DEFAULT_ORGANIZER_NOTIFICATIONS }
        : undefined,
  };
}

function mapPublicProfile(
  student: StudentProfileDto | null | undefined,
  firstName: string,
  lastName: string,
  middleName: string,
): PublicProfile {
  const rawLinks = student?.socialLinks ?? {};
  return {
    avatarUrl: student?.avatarUrl ?? undefined,
    firstName,
    lastName,
    middleName: middleName || undefined,
    university: student?.university ?? "",
    faculty: student?.faculty ?? "",
    course: normalizeCourse(student?.course),
    city: student?.city ?? "",
    bio: student?.bio ?? "",
    socialLinks: {
      telegram: rawLinks.telegram ?? "",
      github: rawLinks.github ?? "",
      linkedin: rawLinks.linkedin ?? "",
      website: rawLinks.website ?? "",
      customLinks: [],
    },
    profileViews30d: student?.profileViews30d ?? 0,
    visibleAchievementIds: student?.visibleAchievementIds ?? [],
    visibleBadgeIds: student?.visibleBadgeIds ?? [],
  };
}

function mapOrganizerProfile(
  organizer: OrganizerProfileDto | null | undefined,
  fallbackName: string,
  fallbackEmail: string,
): OrganizerOrganizationProfile {
  const links = organizer?.socialLinks ?? {};
  return {
    logoUrl: organizer?.logoUrl ?? undefined,
    organizationName: organizer?.organizationName ?? fallbackName,
    shortName: organizer?.shortName ?? organizer?.organizationName ?? fallbackName,
    organizationType: normalizeOrganizationType(organizer?.organizationType),
    website: organizer?.website ?? "",
    description: organizer?.description ?? "",
    contactEmail: organizer?.contactEmail ?? fallbackEmail,
    contactPhone: organizer?.contactPhone ?? undefined,
    socialLinks: {
      telegram: links.telegram ?? "",
      vk: links.vk ?? "",
      youtube: links.youtube ?? "",
      other: [],
    },
    foundedYear: organizer?.foundedYear ?? undefined,
    eventsCount: organizer?.eventsCount ?? 0,
    totalParticipants: organizer?.totalParticipants ?? 0,
  };
}

function mapHrAsOrganizerProfile(
  hr: HrProfileDto | null | undefined,
  fallbackName: string,
  fallbackEmail: string,
): OrganizerOrganizationProfile {
  return {
    logoUrl: undefined,
    organizationName: hr?.companyName ?? fallbackName,
    shortName: hr?.companyName ?? fallbackName,
    organizationType: "other",
    website: hr?.website ?? "",
    description: hr?.description ?? "",
    contactEmail: hr?.contactEmail ?? fallbackEmail,
    contactPhone: hr?.contactPhone ?? undefined,
    socialLinks: {
      telegram: "",
      vk: "",
      youtube: "",
      other: [],
    },
    foundedYear: undefined,
    eventsCount: 0,
    totalParticipants: 0,
  };
}

function frontendRole(role: string): UserRole {
  if (role === "ORGANIZER") return "organizer";
  if (role === "HR" || role === "ADMIN") return "hr";
  return "student";
}

function backendRole(role: UserRole): string {
  if (role === "organizer") return "ORGANIZER";
  if (role === "hr") return "HR";
  return "STUDENT";
}

function parseName(value: string): {
  firstName: string;
  lastName: string;
  middleName?: string;
} {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    lastName: parts[0] ?? "",
    firstName: parts[1] ?? parts[0] ?? "",
    middleName: parts.slice(2).join(" ") || undefined,
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

function normalizeOrganizationType(raw: unknown): OrganizerOrganizationProfile["organizationType"] {
  const allowed: OrganizerOrganizationProfile["organizationType"][] = [
    "university",
    "scientific",
    "olympiad",
    "conference",
    "foundation",
    "educational",
    "other",
  ];
  return typeof raw === "string" && (allowed as string[]).includes(raw)
    ? (raw as OrganizerOrganizationProfile["organizationType"])
    : "other";
}
