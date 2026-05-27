import type {
  Achievement,
  AchievementLevel,
  AchievementStatus,
  AchievementTypeCode,
  AppNotification,
  AuthUser,
  CourseOption,
  Event,
  EventApplication,
  EventCustomField,
  EventType,
  NotificationSettings,
  OrganizerEventFormat,
  OrganizerEventLevel,
  OrganizerEventStatus,
  OrganizerEventType,
  OrganizerNotificationSettings,
  OrganizerOrganizationProfile,
  Participant,
  PublicProfile,
  SocialLinks,
  UserRole,
} from "@/lib/types";
import type {
  LoginPayload,
  RegistrationPayload,
} from "@/components/shared/register-form";
import { buildEventQrCode } from "@/lib/event-meta";
import type { HrCandidateInvitation } from "@/lib/hr-network";
import type { HrFunnelStatus, HrStatusHistoryEntry } from "@/lib/hr-funnel";
import type {
  ArchiveCandidate,
  DashboardMetrics,
  FunnelData,
  StatusCounts,
} from "@/components/hr/dashboards/types";

let memoryAuthToken: string | null = null;
const AUTH_TOKEN_KEY = "hta.api.access-token";

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

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://37.230.169.107/api"
).replace(/\/$/, "");

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

interface EventDatesDto {
  start?: string | null;
  end?: string | null;
  registrationDeadline?: string | null;
}

interface EventCustomFieldDto {
  id?: string | null;
  label?: string | null;
  type?: string | null;
  required?: boolean | null;
  options?: string[] | null;
}

interface EventDto {
  id?: string | null;
  eventId?: string | null;
  organizerId?: string | null;
  title?: string | null;
  type?: string | null;
  level?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  registrationDeadline?: string | null;
  dates?: EventDatesDto | null;
  format?: string | null;
  location?: string | null;
  description?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  status?: string | null;
  participantsCount?: number | null;
  applicationsCount?: number | null;
  customFields?: EventCustomFieldDto[] | null;
  createdAt?: string | null;
  qrCodeUrl?: string | null;
}

interface AchievementDto {
  id?: string | null;
  title?: string | null;
  type?: string | null;
  level?: string | null;
  date?: string | null;
  result?: string | null;
  status?: string | null;
  eventId?: string | null;
  organizerId?: string | null;
  organizerName?: string | null;
  requestedOrganizerId?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  verificationComment?: string | null;
  comment?: string | null;
  requestComment?: string | null;
  eventNotInList?: boolean | null;
}

interface NotificationDto {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  message?: string | null;
  type?: string | null;
  createdAt?: string | null;
  isRead?: boolean | null;
  candidateId?: string | null;
}

interface EventParticipantDto {
  id?: string | null;
  studentId?: string | null;
  studentName?: string | null;
  fullName?: string | null;
  appliedAt?: string | null;
  email?: string | null;
  university?: string | null;
  status?: string | null;
  updatedAt?: string | null;
  decisionComment?: string | null;
  registrationAnswers?: Record<string, unknown> | null;
}

interface StudentInvitationDto {
  id?: string | null;
  candidateId?: string | null;
  candidateName?: string | null;
  hrId?: string | null;
  hrName?: string | null;
  position?: string | null;
  message?: string | null;
  sendNow?: boolean | null;
  scheduledAt?: string | null;
  status?: string | null;
  createdAt?: string | null;
  respondedAt?: string | null;
}

interface SubscriberDto {
  hrId?: string | null;
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  companyName?: string | null;
}

interface HrSettingsDto {
  defaultInviteComment?: string | null;
  confirmRejectAction?: boolean | null;
  confirmArchiveAction?: boolean | null;
}

interface HrHomeResponseDto {
  topByAchievements?: unknown;
  topBySubscribers?: unknown;
  unreadNotificationsCount?: number | null;
}

interface HrCandidateDetailsDto {
  student?: StudentProfileDto | null;
  profile?: StudentProfileDto | null;
  candidate?: StudentProfileDto | null;
  achievements?: AchievementDto[] | null;
  allAchievements?: AchievementDto[] | null;
  visibleAchievements?: AchievementDto[] | null;
  status?: string | null;
  candidateStatus?: string | null;
  statusHistory?: unknown;
  history?: unknown;
  note?: string | null;
  hrNote?: string | null;
  subscribers?: SubscriberDto[] | null;
  invitations?: StudentInvitationDto[] | null;
  recentActions?: unknown;
  visibleAchievementIds?: string[] | null;
  visibleBadgeIds?: string[] | null;
}

export interface HrHomeSummaryData {
  topByAchievements: HrHomeCandidateData[];
  topBySubscribers: HrHomeSubscriberCandidateData[];
  unreadNotificationsCount: number;
}

export interface HrHomeCandidateData {
  id: string;
  name: string;
  email: string;
  university: string;
  totalAchievementsCount: number;
  confirmedAchievementsCount: number;
  candidateStatus: HrFunnelStatus;
}

export interface HrHomeSubscriberCandidateData {
  id: string;
  name: string;
  email: string;
  university: string;
  subscriberCount: number;
  totalAchievementsCount: number;
  candidateStatus: HrFunnelStatus;
}

export interface HrCandidateSummaryData {
  id: string;
  name: string;
  email: string;
  university: string;
  faculty: string;
  course: string;
  totalAchievementsCount: number;
  confirmedAchievementsCount: number;
  candidateStatus: HrFunnelStatus;
}

export interface HrCandidateProfileData {
  candidate: AuthUser | null;
  achievements: Achievement[];
  status: HrFunnelStatus;
  statusHistory: HrStatusHistoryEntry[];
  note: string;
  subscribers: SubscriberDto[];
  invitations: HrCandidateInvitation[];
  recentActions: string[];
}

export interface HrSettingsData {
  defaultInviteComment: string;
  confirmRejectAction: boolean;
  confirmArchiveAction: boolean;
}

export interface HrDashboardData {
  funnelData: FunnelData;
  metrics: DashboardMetrics;
}

export interface OrganizerEventPayload {
  title: string;
  type: OrganizerEventType;
  level: OrganizerEventLevel;
  dates: {
    start: string;
    end: string;
    registrationDeadline: string;
  };
  format: OrganizerEventFormat;
  location?: string;
  description: string;
  website: string;
  contactEmail: string;
  logoUrl?: string;
  bannerUrl?: string;
  status: OrganizerEventStatus;
  customFields: EventCustomField[];
}

export interface StudentAchievementPayload {
  title: string;
  type: EventType;
  level: AchievementLevel;
  date: string;
  result: string;
  eventId?: string;
  organizerName?: string;
  description?: string;
  files?: File[];
}

export interface StudentProfileUpdatePayload {
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
  visibleAchievementIds?: string[];
  visibleBadgeIds?: string[];
  email?: string | null;
}

export interface OrganizerProfileUpdatePayload {
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
  email?: string | null;
}

export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function getToken(): string | null {
  if (memoryAuthToken) {
    return memoryAuthToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (storedToken) {
    memoryAuthToken = storedToken;
  }

  return memoryAuthToken;
}

export function clearBackendToken() {
  memoryAuthToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function hasBackendToken(): boolean {
  return Boolean(getToken());
}

function setToken(token: string) {
  memoryAuthToken = token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!headers.has("Content-Type") && !isFormData) {
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

function normalizeEnum(value?: string | null): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);
  if (entries.length === 0) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function mapBackendHrStatus(value?: string | null): HrFunnelStatus {
  const raw = typeof value === "string" ? value.trim() : "";
  const normalized = normalizeEnum(raw);
  const normalizedKey = normalized
    .replace(/[\s-]+/g, "_")
    .replace(/^CANDIDATES?_/, "")
    .replace(/_CANDIDATES?$/, "");

  switch (normalizedKey) {
    case "NOT_TRACKED":
      return "Не отслеживается";
    case "ON_REVIEW":
    case "IN_REVIEW":
    case "UNDER_REVIEW":
      return "На рассмотрении";
    case "INTERESTED":
      return "Интересует";
    case "INVITED":
      return "Приглашён";
    case "RESPONDED_TO_INVITATION":
    case "INVITATION_RESPONDED":
    case "RESPONDED_INVITATION":
    case "HAS_RESPONDED":
    case "RESPONDED":
      return "Ответили на приглашение";
    case "DECLINED":
    case "REJECTED":
      return "Отклонён";
    default:
      break;
  }

  switch (raw) {
    case "Не отслеживается":
      return "Не отслеживается";
    case "На рассмотрении":
      return "На рассмотрении";
    case "Интересует":
      return "Интересует";
    case "Приглашён":
      return "Приглашён";
    case "Ответили на приглашение":
      return "Ответили на приглашение";
    case "Отклонён":
      return "Отклонён";
    default:
      return "Не отслеживается";
  }
}

function toBackendHrStatus(value: HrFunnelStatus): string {
  switch (value) {
    case "На рассмотрении":
      return "UNDER_REVIEW";
    case "Интересует":
      return "INTERESTED";
    case "Приглашён":
      return "INVITED";
    case "Ответили на приглашение":
      return "RESPONDED";
    case "Отклонён":
      return "REJECTED";
    default:
      return "NOT_TRACKED";
  }
}

function buildUserName(source: Record<string, unknown>): string {
  const rawName = getString(source.name ?? source.fullName ?? source.title);
  if (rawName) return rawName;
  const firstName = getString(source.firstName);
  const lastName = getString(source.lastName);
  const middleName = getString(source.middleName);
  const combined = [lastName, firstName, middleName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return combined || "Пользователь";
}

function extractCandidateSource(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw)) return null;
  if (isRecord(raw.student)) return raw.student;
  if (isRecord(raw.profile)) return raw.profile;
  if (isRecord(raw.candidate)) return raw.candidate;
  if (isRecord(raw.user)) return raw.user;
  return raw;
}

function mapHrCandidateSummary(raw: unknown): HrCandidateSummaryData | null {
  const record = isRecord(raw) ? raw : null;
  if (!record) return null;
  const source = extractCandidateSource(record) ?? record;
  const id =
    getString(source.userId) ||
    getString(source.id) ||
    getString(source.studentId) ||
    getString(record.studentId) ||
    getString(record.id);
  if (!id) return null;
  const email = getString(source.email ?? record.email);
  return {
    id,
    name: buildUserName(source),
    email,
    university: getString(source.university ?? record.university),
    faculty: getString(source.faculty ?? record.faculty),
    course: getString(source.course ?? record.course),
    totalAchievementsCount: getNumber(
      record.totalAchievementsCount ??
        record.totalAchievements ??
        record.achievementsCount,
    ),
    confirmedAchievementsCount: getNumber(
      record.confirmedAchievementsCount ??
        record.confirmedAchievements ??
        record.confirmedCount,
    ),
    candidateStatus: mapBackendHrStatus(
      getString(record.status ?? record.candidateStatus ?? record.funnelStatus),
    ),
  };
}

function mapHrHomeCandidate(raw: unknown): HrHomeCandidateData | null {
  const summary = mapHrCandidateSummary(raw);
  if (!summary) return null;
  return {
    id: summary.id,
    name: summary.name,
    email: summary.email,
    university: summary.university,
    totalAchievementsCount: summary.totalAchievementsCount,
    confirmedAchievementsCount: summary.confirmedAchievementsCount,
    candidateStatus: summary.candidateStatus,
  };
}

function mapHrHomeSubscriberCandidate(
  raw: unknown,
): HrHomeSubscriberCandidateData | null {
  const summary = mapHrCandidateSummary(raw);
  if (!summary) return null;
  const record = isRecord(raw) ? raw : null;
  return {
    id: summary.id,
    name: summary.name,
    email: summary.email,
    university: summary.university,
    subscriberCount: getNumber(record?.subscriberCount ?? record?.subscribers),
    totalAchievementsCount: summary.totalAchievementsCount,
    candidateStatus: summary.candidateStatus,
  };
}

function mapHrStatusHistoryEntry(
  raw: unknown,
  fallbackCandidateId: string,
): HrStatusHistoryEntry | null {
  if (!isRecord(raw)) return null;
  const candidateId =
    getString(raw.candidateId) ||
    getString(raw.studentId) ||
    fallbackCandidateId;
  const fromStatus = mapBackendHrStatus(getString(raw.fromStatus));
  const toStatus = mapBackendHrStatus(getString(raw.toStatus));
  const changedAt = getString(raw.changedAt ?? raw.createdAt ?? raw.date);
  if (!candidateId || !changedAt) return null;
  return {
    id:
      getString(raw.id) ||
      `hr-status-${candidateId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    candidateId,
    fromStatus,
    toStatus,
    changedAt,
    actorName: getString(raw.actorName) || undefined,
    note: getString(raw.note) || undefined,
  };
}

function mapHrSubscriber(raw: unknown): SubscriberDto | null {
  if (!isRecord(raw)) return null;
  const hrId = getString(raw.hrId) || getString(raw.id);
  if (!hrId) return null;
  return {
    hrId,
    id: getString(raw.id) || hrId,
    firstName: getString(raw.firstName) || undefined,
    lastName: getString(raw.lastName) || undefined,
    email: getString(raw.email) || undefined,
    companyName: getString(raw.companyName) || undefined,
  };
}

function mapHrCandidateToAuthUser(
  raw: unknown,
  overrides?: {
    visibleAchievementIds?: string[];
    visibleBadgeIds?: string[];
  },
): AuthUser | null {
  if (!isRecord(raw)) return null;
  const source = extractCandidateSource(raw) ?? raw;
  const id =
    getString(source.userId) ||
    getString(source.id) ||
    getString(source.studentId) ||
    getString(raw.studentId);
  if (!id) return null;
  const email = getString(source.email) || getString(raw.email);
  const firstName = getString(source.firstName);
  const lastName = getString(source.lastName);
  const middleName = getString(source.middleName);
  const name = buildUserName({ ...source, email });
  const visibleAchievementIds =
    overrides?.visibleAchievementIds ??
    getStringArray(source.visibleAchievementIds ?? raw.visibleAchievementIds);
  const visibleBadgeIds =
    overrides?.visibleBadgeIds ??
    getStringArray(source.visibleBadgeIds ?? raw.visibleBadgeIds);

  return {
    id,
    name,
    email,
    role: "student",
    phone: getString(source.phone) || undefined,
    notifications: { ...DEFAULT_NOTIFICATIONS },
    publicProfile: {
      avatarUrl: getString(source.avatarUrl) || undefined,
      firstName,
      lastName,
      middleName: middleName || undefined,
      university: getString(source.university),
      faculty: getString(source.faculty),
      course: normalizeCourse(source.course),
      city: getString(source.city),
      bio: getString(source.bio),
      socialLinks: {
        telegram: getString(
          source.socialLinks &&
            (source.socialLinks as Record<string, unknown>).telegram,
        ),
        github: getString(
          source.socialLinks &&
            (source.socialLinks as Record<string, unknown>).github,
        ),
        linkedin: getString(
          source.socialLinks &&
            (source.socialLinks as Record<string, unknown>).linkedin,
        ),
        website: getString(
          source.socialLinks &&
            (source.socialLinks as Record<string, unknown>).website,
        ),
        customLinks: [],
      },
      profileViews30d: getNumber(source.profileViews30d),
      visibleAchievementIds,
      visibleBadgeIds,
    },
  };
}

function mapHrRecentAction(raw: unknown): string | null {
  if (typeof raw === "string") return raw;
  if (!isRecord(raw)) return null;
  const text =
    getString(raw.text) ||
    getString(raw.message) ||
    getString(raw.description) ||
    getString(raw.note);
  const type = getString(raw.type);
  const candidateName = getString(raw.candidateName ?? raw.studentName);
  const createdAt = getString(raw.createdAt ?? raw.timestamp ?? raw.date);
  const prefix = createdAt
    ? `${new Date(createdAt).toLocaleString("ru-RU")} · `
    : "";
  if (text) return `${prefix}${text}`.trim();
  if (candidateName && type) {
    return `${prefix}${candidateName}: ${type}`.trim();
  }
  if (type) return `${prefix}${type}`.trim();
  return null;
}

function buildEmptyFunnelData(): FunnelData {
  return {
    "На рассмотрении": [],
    Интересует: [],
    Приглашён: [],
    "Ответили на приглашение": [],
    Отклонён: [],
  };
}

function buildEmptyStatusCounts(): StatusCounts {
  return {
    "На рассмотрении": 0,
    Интересует: 0,
    Приглашён: 0,
    "Ответили на приглашение": 0,
    Отклонён: 0,
  };
}

function mapHrFunnelCandidate(raw: unknown): ArchiveCandidate | null {
  if (!isRecord(raw)) return null;
  const source = extractCandidateSource(raw) ?? raw;
  const id =
    getString(source.userId) ||
    getString(source.id) ||
    getString(source.studentId) ||
    getString(raw.studentId);
  if (!id) return null;
  const badgesRaw = Array.isArray(raw.badges) ? raw.badges : [];
  const badges = badgesRaw
    .map((badge) => (isRecord(badge) ? badge : null))
    .filter((badge): badge is Record<string, unknown> => badge !== null)
    .map((badge) => ({
      id: getString(badge.id),
      title: getString(badge.title),
      icon: getString(badge.icon),
    }))
    .filter((badge) => badge.id && badge.title);

  const base = {
    id,
    name: buildUserName(source),
    email: getString(source.email ?? raw.email),
    university:
      getString(source.university ?? raw.university) || "Вуз не указан",
    faculty: getString(source.faculty ?? raw.faculty) || "Факультет не указан",
    course: getString(source.course ?? raw.course) || "Курс не указан",
    totalAchievements: getNumber(
      raw.totalAchievements ?? raw.totalAchievementsCount,
    ),
    confirmedAchievements: getNumber(
      raw.confirmedAchievements ?? raw.confirmedAchievementsCount,
    ),
    badges,
    note: getString(raw.note ?? raw.hrNote),
    hasNewAchievement: Boolean(raw.hasNewAchievement ?? raw.hasUpdates),
  };

  const archiveSourceRaw = getString(raw.archiveSource);
  const archiveSource =
    archiveSourceRaw === "manual" ? "manual" : "stale-invitation";

  return {
    ...base,
    archiveSource,
    archivedAt: getString(
      raw.archivedAt ?? raw.archiveAt ?? new Date().toISOString(),
    ),
    staleDays: Number.isFinite(raw.staleDays)
      ? Number(raw.staleDays)
      : undefined,
    invitationCreatedAt: getString(raw.invitationCreatedAt),
    archiveReason: getString(raw.archiveReason ?? raw.reason),
  };
}

function mapBackendEventType(value?: string | null): OrganizerEventType {
  switch (normalizeEnum(value)) {
    case "OLYMPIAD":
      return "olympiad";
    case "CONFERENCE":
      return "conference";
    case "HACKATHON":
      return "hackathon";
    case "COURSE":
      return "course";
    case "VOLUNTEERING":
      return "volunteering";
    default:
      return "other";
  }
}

function mapBackendEventLevel(value?: string | null): OrganizerEventLevel {
  switch (normalizeEnum(value)) {
    case "INTERNATIONAL":
      return "international";
    case "NATIONAL":
      return "national";
    case "REGIONAL":
      return "regional";
    case "UNIVERSITY":
      return "university";
    case "SCHOOL":
      return "school";
    default:
      return "regional";
  }
}

function mapBackendEventFormat(value?: string | null): OrganizerEventFormat {
  switch (normalizeEnum(value)) {
    case "OFFLINE":
      return "offline";
    case "ONLINE":
      return "online";
    case "HYBRID":
      return "hybrid";
    default:
      return "online";
  }
}

function mapBackendEventStatus(value?: string | null): OrganizerEventStatus {
  switch (normalizeEnum(value)) {
    case "DRAFT":
      return "draft";
    case "PUBLISHED":
      return "published";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "draft";
  }
}

function mapBackendAchievementType(value?: string | null): AchievementTypeCode {
  switch (normalizeEnum(value)) {
    case "OLYMPIAD":
      return "OLYMPIAD";
    case "CONFERENCE":
      return "CONFERENCE";
    case "HACKATHON":
      return "HACKATHON";
    case "PUBLICATION":
      return "PUBLICATION";
    case "COURSE":
      return "COURSE";
    case "VOLUNTEERING":
      return "VOLUNTEERING";
    case "GRANT":
      return "GRANT";
    case "CHAMPIONSHIP":
      return "CHAMPIONSHIP";
    case "CONTEST":
      return "CONTEST";
    default:
      return "OTHER";
  }
}

function mapBackendAchievementTypeLabel(value: AchievementTypeCode): EventType {
  switch (value) {
    case "OLYMPIAD":
      return "Олимпиада";
    case "CONFERENCE":
      return "Конференция";
    case "HACKATHON":
      return "Хакатон";
    case "CHAMPIONSHIP":
      return "Чемпионат";
    case "CONTEST":
      return "Конкурс";
    default:
      return "Другое";
  }
}

function mapBackendAchievementLevel(value?: string | null): AchievementLevel {
  switch (normalizeEnum(value)) {
    case "INTERNATIONAL":
      return "Международный";
    case "NATIONAL":
      return "Всероссийский";
    case "REGIONAL":
      return "Региональный";
    case "UNIVERSITY":
      return "Вузовский";
    case "SCHOOL":
      return "Факультетский";
    default:
      return "Региональный";
  }
}

function mapBackendAchievementStatus(value?: string | null): AchievementStatus {
  switch (normalizeEnum(value)) {
    case "VERIFIED":
      return "Подтверждено";
    case "REJECTED":
      return "Отклонено";
    case "PENDING":
    default:
      return "На проверке";
  }
}

function mapBackendAchievementResult(value?: string | null): string {
  if (!value) return "Участник";
  const normalized = normalizeEnum(value);
  switch (normalized) {
    case "WINNER":
      return "1 место";
    case "PRIZE":
      return "Призер";
    case "PARTICIPANT":
      return "Участник";
    case "PUBLISHED":
      return "Опубликовано";
    case "OTHER":
      return "Другое";
    default:
      return value;
  }
}

function mapBackendNotificationType(
  value?: string | null,
): AppNotification["type"] {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  if (normalized === "achievement") return "achievement";
  if (normalized === "event") return "event";
  if (normalized === "message") return "message";
  return "system";
}

function mapCustomFieldType(value?: string | null): EventCustomField["type"] {
  const normalized = normalizeEnum(value);
  if (normalized === "FILE") return "file";
  if (normalized === "SELECT") return "select";
  return "text";
}

function mapBackendEvent(dto: EventDto): Event {
  const id = dto.id ?? dto.eventId ?? "";
  const start = dto.startDate ?? dto.dates?.start ?? "";
  const end = dto.endDate ?? dto.dates?.end ?? start;
  const registrationDeadline =
    dto.registrationDeadline ?? dto.dates?.registrationDeadline ?? start;
  const customFields = (dto.customFields ?? [])
    .filter(Boolean)
    .map((field) => ({
      id: field.id ?? `cf-${Math.random().toString(36).slice(2, 8)}`,
      label: field.label ?? "",
      type: mapCustomFieldType(field.type ?? undefined),
      required: Boolean(field.required),
      options: field.options ?? undefined,
    }));

  return {
    id,
    organizerId: dto.organizerId ?? "",
    title: dto.title ?? "",
    type: mapBackendEventType(dto.type),
    level: mapBackendEventLevel(dto.level),
    dates: {
      start,
      end,
      registrationDeadline,
    },
    format: mapBackendEventFormat(dto.format),
    location: dto.location ?? "",
    description: dto.description ?? "",
    website: dto.website ?? "",
    contactEmail: dto.contactEmail ?? "",
    logoUrl: dto.logoUrl ?? "",
    bannerUrl: dto.bannerUrl ?? "",
    qrCodeUrl: dto.qrCodeUrl ?? (id ? buildEventQrCode(id) : ""),
    status: mapBackendEventStatus(dto.status),
    participantsCount: dto.participantsCount ?? 0,
    applicationsCount: dto.applicationsCount ?? dto.participantsCount ?? 0,
    customFields,
    createdAt: dto.createdAt ?? new Date().toISOString(),
  };
}

function mapBackendAchievement(
  dto: AchievementDto,
  fallbackStudentId?: string,
): Achievement {
  const eventId = dto.eventId ?? undefined;
  const studentId = dto.studentId ?? fallbackStudentId ?? "";
  const achievementTypeCode = mapBackendAchievementType(dto.type);
  return {
    id: dto.id ?? "",
    title: dto.title ?? "",
    level: mapBackendAchievementLevel(dto.level),
    date: dto.date ?? new Date().toISOString().split("T")[0],
    result: mapBackendAchievementResult(dto.result),
    status: mapBackendAchievementStatus(dto.status),
    eventId,
    achievementTypeCode,
    eventType: mapBackendAchievementTypeLabel(achievementTypeCode),
    studentId,
    studentName: dto.studentName ?? undefined,
    requestedOrganizerId:
      dto.requestedOrganizerId ?? dto.organizerId ?? undefined,
    eventNotInList: Boolean(dto.eventNotInList),
    requestComment: dto.requestComment ?? undefined,
    verificationComment: dto.verificationComment ?? dto.comment ?? undefined,
    source: eventId ? "organizer" : "manual",
  };
}

function mapBackendNotification(
  dto: NotificationDto,
  userId?: string,
): AppNotification {
  return {
    id: dto.id ?? `ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: userId ?? "",
    title: dto.title ?? "",
    description: dto.description ?? dto.message ?? "",
    type: mapBackendNotificationType(dto.type),
    createdAt: dto.createdAt ?? new Date().toISOString(),
    isRead: Boolean(dto.isRead),
    candidateId: dto.candidateId ?? undefined,
  };
}

function mapBackendEventParticipant(
  dto: EventParticipantDto,
  eventId: string,
): EventApplication {
  const studentId = dto.studentId ?? "";
  const name = dto.studentName ?? dto.fullName ?? "";
  return {
    id:
      dto.id ??
      (studentId ? `app-${eventId}-${studentId}` : `app-${Date.now()}`),
    eventId,
    studentId,
    studentName: name,
    email: dto.email ?? undefined,
    university: dto.university ?? undefined,
    status:
      dto.status === "APPROVED" ||
      dto.status === "REJECTED" ||
      dto.status === "WITHDRAWN"
        ? dto.status
        : "PENDING",
    appliedAt: dto.appliedAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? undefined,
    decisionComment: dto.decisionComment ?? undefined,
    registrationAnswers: dto.registrationAnswers ?? undefined,
  };
}

function mapBackendInvitation(
  dto: StudentInvitationDto,
  fallbackCandidateId?: string,
): HrCandidateInvitation {
  const statusRaw = typeof dto.status === "string" ? dto.status : "pending";
  const normalizedStatus = statusRaw.trim().toLowerCase();
  const status: HrCandidateInvitation["status"] =
    normalizedStatus === "accepted"
      ? "accepted"
      : normalizedStatus === "rejected"
        ? "rejected"
        : "pending";

  return {
    id: dto.id ?? `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    candidateId: dto.candidateId ?? fallbackCandidateId ?? "",
    candidateName: dto.candidateName ?? "",
    hrId: dto.hrId ?? "",
    hrName: dto.hrName ?? "HR",
    position: dto.position ?? "",
    message: dto.message ?? "",
    sendNow: Boolean(dto.sendNow),
    scheduledAt: dto.scheduledAt ?? undefined,
    status,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    respondedAt: dto.respondedAt ?? undefined,
  };
}

function toBackendAchievementType(value: EventType): string {
  switch (value) {
    case "Олимпиада":
      return "OLYMPIAD";
    case "Конференция":
      return "CONFERENCE";
    case "Хакатон":
      return "HACKATHON";
    case "Чемпионат":
      return "CHAMPIONSHIP";
    case "Конкурс":
      return "CONTEST";
    default:
      return "OTHER";
  }
}

function toBackendLevelFromAchievement(value: AchievementLevel): string {
  switch (value) {
    case "Международный":
      return "INTERNATIONAL";
    case "Всероссийский":
      return "NATIONAL";
    case "Региональный":
      return "REGIONAL";
    case "Вузовский":
      return "UNIVERSITY";
    case "Факультетский":
      return "SCHOOL";
    default:
      return "REGIONAL";
  }
}

function toBackendEventType(value: OrganizerEventType): string {
  switch (value) {
    case "olympiad":
      return "OLYMPIAD";
    case "conference":
      return "CONFERENCE";
    case "hackathon":
      return "HACKATHON";
    case "course":
      return "COURSE";
    case "volunteering":
      return "VOLUNTEERING";
    default:
      return "OTHER";
  }
}

function toBackendEventLevel(value: OrganizerEventLevel): string {
  switch (value) {
    case "international":
      return "INTERNATIONAL";
    case "national":
      return "NATIONAL";
    case "regional":
      return "REGIONAL";
    case "university":
      return "UNIVERSITY";
    case "school":
      return "SCHOOL";
    default:
      return "REGIONAL";
  }
}

function toBackendEventFormat(value: OrganizerEventFormat): string {
  switch (value) {
    case "offline":
      return "OFFLINE";
    case "hybrid":
      return "HYBRID";
    default:
      return "ONLINE";
  }
}

function toBackendEventStatus(value: OrganizerEventStatus): string {
  switch (value) {
    case "published":
      return "PUBLISHED";
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "DRAFT";
  }
}

// 1. Auth
export async function backendLogin(payload: LoginPayload): Promise<AuthUser> {
  const auth = await request<AuthResponseDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setToken(auth.accessToken);
  const profile = await request<MyProfileResponseDto>("/users/me");
  return mapMyProfile(profile);
}

export async function backendRegister(
  payload: RegistrationPayload,
): Promise<AuthUser> {
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

// 4. Student
export async function fetchStudentProfile(): Promise<AuthUser> {
  const profile = await request<StudentProfileDto>("/students/me");
  return mapStudentProfile(profile);
}

export async function updateStudentProfile(
  payload: StudentProfileUpdatePayload,
): Promise<AuthUser> {
  const profile = await request<StudentProfileDto>("/students/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapStudentProfile(profile);
}

// 6. HR
export async function fetchHrProfile(): Promise<AuthUser> {
  const profile = await request<HrProfileDto>("/hr/me");
  return mapHrProfile(profile);
}

export async function updateHrProfile(
  payload: OrganizerProfileUpdatePayload,
): Promise<AuthUser> {
  const profile = await request<HrProfileDto>("/hr/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapHrProfile(profile);
}

export async function updateOrganizerProfile(
  payload: OrganizerProfileUpdatePayload,
): Promise<AuthUser> {
  await request<void>("/organizers/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return backendGetProfile();
}

// 2. Users
export async function backendGetProfile(): Promise<AuthUser> {
  const profile = await request<MyProfileResponseDto>("/users/me");
  return mapMyProfile(profile);
}

export async function backendChangePassword(
  payload: PasswordChangePayload,
): Promise<void> {
  await request<void>("/users/me/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// 3. Public
export async function fetchPublicEvents(params?: {
  query?: string;
  type?: string;
  level?: string;
}): Promise<Event[]> {
  const query = buildQuery({
    query: params?.query,
    type: params?.type,
    level: params?.level,
  });
  const data = await request<EventDto[]>(`/public/events${query}`);
  return Array.isArray(data) ? data.map(mapBackendEvent) : [];
}

export async function fetchPublicOrganizerProfile(
  organizerId: string,
): Promise<OrganizerOrganizationProfile | null> {
  if (!organizerId) return null;
  const data = await request<
    OrganizerProfileDto & { organizer?: OrganizerProfileDto }
  >(`/public/organizers/${organizerId}`);
  const organizer = data.organizer ?? data;
  if (!organizer) return null;
  const fallbackName = organizer.organizationName ?? organizer.shortName ?? "";
  const fallbackEmail = organizer.contactEmail ?? "";
  return mapOrganizerProfile(organizer, fallbackName, fallbackEmail);
}

export async function fetchStudentAchievements(
  studentId?: string,
  params?: {
    type?: string;
    year?: string;
    status?: string;
    query?: string;
  },
): Promise<Achievement[]> {
  const query = buildQuery({
    type: params?.type,
    year: params?.year,
    status: params?.status,
    query: params?.query,
  });
  const data = await request<AchievementDto[]>(
    `/students/me/achievements${query}`,
  );
  return Array.isArray(data)
    ? data.map((item) => mapBackendAchievement(item, studentId))
    : [];
}

export async function updateStudentAchievement(
  achievementId: string,
  payload: Partial<StudentAchievementPayload>,
): Promise<Achievement> {
  const updated = await request<AchievementDto>(
    `/students/me/achievements/${achievementId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  return mapBackendAchievement(updated);
}

export async function createStudentAchievement(
  payload: StudentAchievementPayload,
): Promise<Achievement> {
  const formData = new FormData();
  formData.set("type", toBackendAchievementType(payload.type));
  formData.set("title", payload.title);
  formData.set("level", toBackendLevelFromAchievement(payload.level));
  formData.set("date", payload.date);
  formData.set("result", payload.result);
  if (payload.eventId) {
    formData.set("eventId", payload.eventId);
  }
  if (payload.organizerName) {
    formData.set("organizerName", payload.organizerName);
  }
  if (payload.description) {
    formData.set("description", payload.description);
  }
  (payload.files ?? []).forEach((file) => {
    formData.append("files", file);
  });

  const created = await request<AchievementDto>("/students/me/achievements", {
    method: "POST",
    body: formData,
  });

  return mapBackendAchievement(created);
}

export async function deleteStudentAchievement(
  achievementId: string,
): Promise<void> {
  await request<void>(`/students/me/achievements/${achievementId}`, {
    method: "DELETE",
  });
}

export async function registerStudentForEvent(eventId: string): Promise<void> {
  await request<void>(`/students/me/events/${eventId}/register`, {
    method: "POST",
  });
}

export async function unregisterStudentForEvent(
  eventId: string,
): Promise<void> {
  await request<void>(`/students/me/events/${eventId}/register`, {
    method: "DELETE",
  });
}

export async function fetchStudentInvitations(
  candidateId?: string,
): Promise<HrCandidateInvitation[]> {
  const data = await request<StudentInvitationDto[]>(
    "/students/me/invitations",
  );
  return Array.isArray(data)
    ? data.map((item) => mapBackendInvitation(item, candidateId))
    : [];
}

export async function respondToStudentInvitation(
  invitationId: string,
  response: "accepted" | "rejected" | "ACCEPTED" | "REJECTED",
  candidateId?: string,
): Promise<HrCandidateInvitation> {
  const updated = await request<StudentInvitationDto>(
    `/students/me/invitations/${invitationId}/respond`,
    {
      method: "POST",
      body: JSON.stringify({
        response:
          response === "accepted" || response === "ACCEPTED"
            ? "ACCEPTED"
            : "REJECTED",
      }),
    },
  );
  return mapBackendInvitation(updated, candidateId);
}

export async function fetchStudentSubscribers(): Promise<SubscriberDto[]> {
  const data = await request<SubscriberDto[]>("/students/me/subscribers");
  return Array.isArray(data) ? data : [];
}

export async function fetchHrSettings(): Promise<HrSettingsData> {
  const data = await request<HrSettingsDto>("/hr/me/settings");
  return {
    defaultInviteComment: getString(data?.defaultInviteComment),
    confirmRejectAction: data?.confirmRejectAction ?? true,
    confirmArchiveAction: data?.confirmArchiveAction ?? true,
  };
}

export async function updateHrSettings(
  payload: Partial<HrSettingsData>,
): Promise<HrSettingsData> {
  const data = await request<HrSettingsDto>("/hr/me/settings", {
    method: "PATCH",
    body: JSON.stringify({
      defaultInviteComment: payload.defaultInviteComment,
      confirmRejectAction: payload.confirmRejectAction,
      confirmArchiveAction: payload.confirmArchiveAction,
    }),
  });
  return {
    defaultInviteComment:
      getString(data?.defaultInviteComment) ||
      getString(payload.defaultInviteComment),
    confirmRejectAction:
      data?.confirmRejectAction ?? payload.confirmRejectAction ?? true,
    confirmArchiveAction:
      data?.confirmArchiveAction ?? payload.confirmArchiveAction ?? true,
  };
}

export async function fetchHrHome(): Promise<HrHomeSummaryData> {
  const data = await request<HrHomeResponseDto>("/hr/home");
  const rawTopAchievements = Array.isArray(data?.topByAchievements)
    ? data.topByAchievements
    : isRecord(data) && Array.isArray(data.topAchievements)
      ? data.topAchievements
      : [];
  const rawTopSubscribers = Array.isArray(data?.topBySubscribers)
    ? data.topBySubscribers
    : isRecord(data) && Array.isArray(data.topSubscribers)
      ? data.topSubscribers
      : [];
  return {
    topByAchievements: rawTopAchievements
      .map(mapHrHomeCandidate)
      .filter((item): item is HrHomeCandidateData => item !== null)
      .slice(0, 3),
    topBySubscribers: rawTopSubscribers
      .map(mapHrHomeSubscriberCandidate)
      .filter((item): item is HrHomeSubscriberCandidateData => item !== null)
      .slice(0, 3),
    unreadNotificationsCount: getNumber(data?.unreadNotificationsCount),
  };
}

export async function fetchHrCandidatesSearch(params?: {
  query?: string;
  university?: string;
  course?: string;
  level?: string;
  type?: string;
  minActivityIndex?: number;
  status?: string;
  archived?: boolean;
  onlyInFunnel?: boolean;
}): Promise<HrCandidateSummaryData[]> {
  const query = buildQuery({
    query: params?.query,
    university: params?.university,
    course: params?.course,
    level: params?.level,
    type: params?.type,
    minActivityIndex: params?.minActivityIndex,
    status: params?.status,
    archived: params?.archived,
    onlyInFunnel: params?.onlyInFunnel,
  });
  const data = await request<unknown>(`/hr/candidates/search${query}`);
  const list = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.items)
      ? data.items
      : isRecord(data) && Array.isArray(data.candidates)
        ? data.candidates
        : [];
  return list
    .map(mapHrCandidateSummary)
    .filter((item): item is HrCandidateSummaryData => item !== null);
}

export async function fetchHrCandidateDetails(
  studentId: string,
): Promise<HrCandidateProfileData> {
  const data = await request<HrCandidateDetailsDto>(
    `/hr/candidates/${studentId}`,
  );
  const achievementsRaw =
    data.achievements ?? data.allAchievements ?? data.visibleAchievements ?? [];
  const achievements = Array.isArray(achievementsRaw)
    ? achievementsRaw.map((item) => mapBackendAchievement(item, studentId))
    : [];
  const visibleAchievementIds =
    getStringArray(data.visibleAchievementIds).length > 0
      ? getStringArray(data.visibleAchievementIds)
      : Array.isArray(data.visibleAchievements)
        ? data.visibleAchievements
            .map((item) => (isRecord(item) ? getString(item.id) : ""))
            .filter(Boolean)
        : [];
  const visibleBadgeIds = getStringArray(data.visibleBadgeIds);
  const candidate = mapHrCandidateToAuthUser(data, {
    visibleAchievementIds,
    visibleBadgeIds,
  });
  const status = mapBackendHrStatus(
    getString(data.status ?? data.candidateStatus),
  );
  const historyRaw = Array.isArray(data.statusHistory)
    ? data.statusHistory
    : Array.isArray(data.history)
      ? data.history
      : [];
  const statusHistory = historyRaw
    .map((entry) => mapHrStatusHistoryEntry(entry, candidate?.id ?? studentId))
    .filter((entry): entry is HrStatusHistoryEntry => entry !== null);
  const subscribers = Array.isArray(data.subscribers)
    ? data.subscribers
        .map(mapHrSubscriber)
        .filter((item): item is SubscriberDto => item !== null)
    : [];
  const invitations = Array.isArray(data.invitations)
    ? data.invitations.map((item) => mapBackendInvitation(item, studentId))
    : [];
  const recentActions = Array.isArray(data.recentActions)
    ? data.recentActions
        .map(mapHrRecentAction)
        .filter((item): item is string => Boolean(item))
    : [];

  return {
    candidate,
    achievements,
    status,
    statusHistory,
    note: getString(data.note ?? data.hrNote),
    subscribers,
    invitations,
    recentActions,
  };
}

export async function updateHrCandidateStatus(
  studentId: string,
  status: HrFunnelStatus,
  note?: string,
): Promise<void> {
  await request<void>(`/hr/candidates/${studentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status: toBackendHrStatus(status),
      note: note ?? "",
    }),
  });
}

export async function updateHrCandidateNote(
  studentId: string,
  note: string,
): Promise<void> {
  await request<void>(`/hr/candidates/${studentId}/note`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  });
}

export async function toggleHrCandidateSubscriptionApi(
  studentId: string,
): Promise<{ isSubscribed: boolean; subscribedAt?: string }> {
  const data = await request<unknown>(
    `/hr/candidates/${studentId}/subscription/toggle`,
    {
      method: "POST",
    },
  );
  if (!isRecord(data)) {
    return { isSubscribed: false };
  }
  const isSubscribed =
    Boolean(data.isSubscribed) ||
    Boolean(data.subscribed) ||
    Boolean(data.isActive);
  return {
    isSubscribed,
    subscribedAt: getString(data.subscribedAt) || undefined,
  };
}

export async function fetchHrCandidateSubscribers(
  studentId: string,
): Promise<SubscriberDto[]> {
  const data = await request<SubscriberDto[]>(
    `/hr/candidates/${studentId}/subscribers`,
  );
  return Array.isArray(data) ? data : [];
}

export async function createHrCandidateInvitation(
  studentId: string,
  payload: {
    position: string;
    message: string;
    sendNow: boolean;
    scheduledAt?: string;
  },
): Promise<HrCandidateInvitation> {
  const data = await request<StudentInvitationDto>(
    `/hr/candidates/${studentId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify({
        position: payload.position,
        message: payload.message,
        sendNow: payload.sendNow,
        scheduledAt: payload.sendNow ? null : (payload.scheduledAt ?? null),
      }),
    },
  );
  return mapBackendInvitation(data, studentId);
}

export async function archiveHrCandidate(
  studentId: string,
  reason?: string,
): Promise<void> {
  await request<void>(`/hr/candidates/${studentId}/archive`, {
    method: "POST",
    body: JSON.stringify({ reason: reason ?? "" }),
  });
}

export async function fetchHrDashboard(days: number): Promise<HrDashboardData> {
  const query = buildQuery({ days });
  const data = await request<unknown>(`/hr/dashboard${query}`);
  const source = isRecord(data)
    ? (data.funnelData ?? data.funnel ?? data.kanban ?? data.columns ?? data)
    : null;
  const funnelData = buildEmptyFunnelData();
  const extractCandidatesList = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (!isRecord(value)) return [];
    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.candidates)) return value.candidates;
    if (Array.isArray(value.data)) return value.data;
    return [];
  };

  const pushCandidate = (status: HrFunnelStatus, rawCandidate: unknown) => {
    if (status === "Не отслеживается") return;
    const mapped = mapHrFunnelCandidate(rawCandidate);
    if (!mapped) return;
    const {
      archiveSource,
      archivedAt,
      staleDays,
      invitationCreatedAt,
      archiveReason,
      ...candidate
    } = mapped;
    void archiveSource;
    void archivedAt;
    void staleDays;
    void invitationCreatedAt;
    void archiveReason;
    funnelData[status].push(candidate);
  };

  const tryPushByCandidateStatus = (rawCandidate: unknown): boolean => {
    if (!isRecord(rawCandidate)) return false;
    const status = mapBackendHrStatus(
      getString(
        rawCandidate.status ??
          rawCandidate.candidateStatus ??
          rawCandidate.funnelStatus ??
          rawCandidate.column,
      ),
    );
    if (status === "Не отслеживается") return false;
    pushCandidate(status, rawCandidate);
    return true;
  };

  if (Array.isArray(source)) {
    source.forEach((rawEntry) => {
      if (isRecord(rawEntry)) {
        const list = extractCandidatesList(rawEntry);
        if (list.length > 0) {
          const statusFromEntry = mapBackendHrStatus(
            getString(
              rawEntry.status ??
                rawEntry.columnStatus ??
                rawEntry.key ??
                rawEntry.name ??
                rawEntry.column,
            ),
          );

          if (statusFromEntry !== "Не отслеживается") {
            list.forEach((rawCandidate) => {
              pushCandidate(statusFromEntry, rawCandidate);
            });
            return;
          }

          list.forEach((rawCandidate) => {
            tryPushByCandidateStatus(rawCandidate);
          });
          return;
        }
      }

      tryPushByCandidateStatus(rawEntry);
    });
  } else if (isRecord(source)) {
    Object.entries(source).forEach(([key, value]) => {
      const list = extractCandidatesList(value);
      if (list.length === 0) return;

      const statusFromKey = mapBackendHrStatus(key);
      if (statusFromKey !== "Не отслеживается") {
        list.forEach((rawCandidate) => {
          pushCandidate(statusFromKey, rawCandidate);
        });
        return;
      }

      list.forEach((rawCandidate) => {
        tryPushByCandidateStatus(rawCandidate);
      });
    });
  }

  const metricsSource =
    isRecord(data) && isRecord(data.metrics)
      ? data.metrics
      : isRecord(data)
        ? data
        : null;
  const byStatus = buildEmptyStatusCounts();
  if (metricsSource && isRecord(metricsSource.byStatus)) {
    Object.entries(metricsSource.byStatus).forEach(([key, value]) => {
      const status = mapBackendHrStatus(key);
      if (status === "Не отслеживается") return;
      byStatus[status] = getNumber(value);
    });
  } else {
    Object.entries(funnelData).forEach(([key, value]) => {
      byStatus[key as keyof StatusCounts] = value.length;
    });
  }

  const inFunnelCount = getNumber(
    metricsSource?.inFunnelCount ??
      metricsSource?.inFunnel ??
      Object.values(byStatus).reduce((acc, value) => acc + value, 0),
  );
  const activeCount = getNumber(
    metricsSource?.activeCount ?? metricsSource?.active ?? inFunnelCount,
  );
  const confirmedAchievementsCount = getNumber(
    metricsSource?.confirmedAchievementsCount ??
      metricsSource?.confirmedAchievements,
  );

  return {
    funnelData,
    metrics: {
      inFunnelCount,
      activeCount,
      confirmedAchievementsCount,
      byStatus,
    },
  };
}

export async function fetchHrArchive(
  days: number,
): Promise<ArchiveCandidate[]> {
  const query = buildQuery({ days });
  const data = await request<unknown>(`/hr/archive${query}`);
  const list = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.items)
      ? data.items
      : isRecord(data) && Array.isArray(data.archive)
        ? data.archive
        : [];
  return list
    .map(mapHrFunnelCandidate)
    .filter((item): item is ArchiveCandidate => item !== null);
}

export async function fetchHrRecentActions(params: {
  days: number;
  type?: string;
}): Promise<string[]> {
  const query = buildQuery({ days: params.days, type: params.type });
  const data = await request<unknown>(`/hr/recent-actions${query}`);
  const list = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.items)
      ? data.items
      : isRecord(data) && Array.isArray(data.actions)
        ? data.actions
        : [];
  return list
    .map(mapHrRecentAction)
    .filter((item): item is string => Boolean(item));
}

export async function fetchPublicHrProfile(
  hrId: string,
): Promise<AuthUser | null> {
  if (!hrId) return null;
  const data = await request<HrProfileDto & { hr?: HrProfileDto }>(
    `/public/hr/${hrId}`,
  );
  const hr = data.hr ?? data;
  if (!hr) return null;
  const name = buildUserName(hr as unknown as Record<string, unknown>);
  return {
    id: hrId,
    name,
    email: hr.email ?? "",
    role: "hr",
    phone: hr.phone ?? undefined,
    notifications: { ...DEFAULT_NOTIFICATIONS },
    publicProfile: {
      avatarUrl: undefined,
      firstName: hr.firstName ?? "",
      lastName: hr.lastName ?? "",
      middleName: hr.middleName ?? undefined,
      university: "",
      faculty: "",
      course: "1",
      city: "",
      bio: "",
      socialLinks: { ...DEFAULT_SOCIAL_LINKS },
      profileViews30d: 0,
      visibleAchievementIds: [],
      visibleBadgeIds: [],
    },
    organizerProfile: mapHrAsOrganizerProfile(hr, name, hr.email ?? ""),
    organizerNotifications: { ...DEFAULT_ORGANIZER_NOTIFICATIONS },
  };
}

// 5. Organizer
export async function fetchOrganizerEvents(
  status?: OrganizerEventStatus,
): Promise<Event[]> {
  const query = buildQuery({
    status: status ? toBackendEventStatus(status) : undefined,
  });
  const data = await request<EventDto[]>(`/organizers/me/events${query}`);
  return Array.isArray(data) ? data.map(mapBackendEvent) : [];
}

export async function createOrganizerEvent(
  payload: OrganizerEventPayload,
): Promise<Event> {
  const body = {
    title: payload.title,
    type: toBackendEventType(payload.type),
    level: toBackendEventLevel(payload.level),
    startDate: payload.dates.start,
    endDate: payload.dates.end,
    registrationDeadline: payload.dates.registrationDeadline,
    format: toBackendEventFormat(payload.format),
    location: payload.location ?? "",
    description: payload.description,
    website: payload.website,
    contactEmail: payload.contactEmail,
    logoUrl: payload.logoUrl ?? "",
    bannerUrl: payload.bannerUrl ?? "",
    status: toBackendEventStatus(payload.status),
    customFields: payload.customFields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options ?? [],
    })),
  };

  const created = await request<EventDto>("/organizers/me/events", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return mapBackendEvent(created);
}

export async function updateOrganizerEvent(
  eventId: string,
  payload: OrganizerEventPayload,
): Promise<Event> {
  const body = {
    title: payload.title,
    type: toBackendEventType(payload.type),
    level: toBackendEventLevel(payload.level),
    startDate: payload.dates.start,
    endDate: payload.dates.end,
    registrationDeadline: payload.dates.registrationDeadline,
    format: toBackendEventFormat(payload.format),
    location: payload.location ?? "",
    description: payload.description,
    website: payload.website,
    contactEmail: payload.contactEmail,
    logoUrl: payload.logoUrl ?? "",
    bannerUrl: payload.bannerUrl ?? "",
    status: toBackendEventStatus(payload.status),
    customFields: payload.customFields.map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      options: field.options ?? [],
    })),
  };

  const updated = await request<EventDto>(`/organizers/me/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  return mapBackendEvent(updated);
}

export async function deleteOrganizerEvent(eventId: string): Promise<void> {
  await request<void>(`/organizers/me/events/${eventId}`, {
    method: "DELETE",
  });
}

export async function fetchOrganizerEventParticipants(
  eventId: string,
): Promise<EventApplication[]> {
  const data = await request<EventParticipantDto[]>(
    `/organizers/me/events/${eventId}/participants`,
  );
  return Array.isArray(data)
    ? data.map((item) => mapBackendEventParticipant(item, eventId))
    : [];
}

export async function fetchOrganizerEventApplications(
  eventId: string,
): Promise<EventApplication[]> {
  const data = await request<EventParticipantDto[]>(
    `/organizers/me/events/${eventId}/applications`,
  );
  return Array.isArray(data)
    ? data.map((item) => mapBackendEventParticipant(item, eventId))
    : [];
}

export async function approveOrganizerEventApplication(
  eventId: string,
  applicationId: string,
  comment?: string,
): Promise<EventApplication> {
  const data = await request<EventParticipantDto>(
    `/organizers/me/events/${eventId}/applications/${applicationId}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? "" }),
    },
  );
  return mapBackendEventParticipant(data, eventId);
}

export async function rejectOrganizerEventApplication(
  eventId: string,
  applicationId: string,
  comment?: string,
): Promise<EventApplication> {
  const data = await request<EventParticipantDto>(
    `/organizers/me/events/${eventId}/applications/${applicationId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? "" }),
    },
  );
  return mapBackendEventParticipant(data, eventId);
}

export async function publishOrganizerResults(
  eventId: string,
  participants: Participant[],
): Promise<{
  imported: number;
  updatedExisting: number;
  skipped: number;
  messages: string[];
}> {
  const data = await request<{
    imported?: number;
    updatedExisting?: number;
    skipped?: number;
    messages?: string[];
  }>(`/organizers/me/events/${eventId}/results/publish`, {
    method: "POST",
    body: JSON.stringify({
      participants: participants.map((item) => ({
        studentId: item.studentId,
        studentName: item.studentName,
        result: item.result,
      })),
    }),
  });

  return {
    imported: data.imported ?? 0,
    updatedExisting: data.updatedExisting ?? 0,
    skipped: data.skipped ?? 0,
    messages: Array.isArray(data.messages) ? data.messages : [],
  };
}

export async function fetchOrganizerVerificationRequests(params?: {
  eventId?: string;
  status?: string;
}): Promise<Achievement[]> {
  const query = buildQuery({
    eventId: params?.eventId,
    status: params?.status,
  });
  const data = await request<AchievementDto[]>(
    `/organizers/me/verification-requests${query}`,
  );
  return Array.isArray(data)
    ? data.map((item) => mapBackendAchievement(item))
    : [];
}

export async function verifyAchievementRequest(
  achievementId: string,
  comment?: string,
): Promise<void> {
  await request<void>(
    `/organizers/me/verification-requests/${achievementId}/verify`,
    {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? "" }),
    },
  );
}

export async function rejectAchievementRequest(
  achievementId: string,
  comment?: string,
): Promise<void> {
  await request<void>(
    `/organizers/me/verification-requests/${achievementId}/reject`,
    {
      method: "POST",
      body: JSON.stringify({ comment: comment ?? "" }),
    },
  );
}

// 7. Notifications
export async function fetchNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const data = await request<NotificationDto[]>("/notifications");
  return Array.isArray(data)
    ? data.map((item) => mapBackendNotification(item, userId))
    : [];
}

// 8. Files
export async function fetchFile(fileId: string): Promise<Response> {
  return fetch(`${API_BASE}/files/${fileId}`, {
    headers: getToken()
      ? {
          Authorization: `Bearer ${getToken()}`,
        }
      : undefined,
  });
}

export async function markNotificationRead(
  notificationId: string,
): Promise<void> {
  await request<void>(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<void>("/notifications/read", {
    method: "POST",
  });
}

function mapMyProfile(profile: MyProfileResponseDto): AuthUser {
  const role = frontendRole(profile.role);
  const source = profile.student ?? profile.organizer ?? profile.hr;
  const firstName = source?.firstName ?? "";
  const lastName = source?.lastName ?? "";
  const middleName = source?.middleName ?? "";
  const name =
    [firstName, lastName, middleName].filter(Boolean).join(" ").trim() ||
    profile.email;

  return {
    id: profile.userId,
    name,
    email: profile.email,
    role,
    phone: source?.phone ?? undefined,
    notifications: { ...DEFAULT_NOTIFICATIONS },
    publicProfile: mapPublicProfile(
      profile.student,
      firstName,
      lastName,
      middleName,
    ),
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

function mapStudentProfile(profile: StudentProfileDto): AuthUser {
  const firstName = profile.firstName ?? "";
  const lastName = profile.lastName ?? "";
  const middleName = profile.middleName ?? "";
  const name =
    [firstName, lastName, middleName].filter(Boolean).join(" ").trim() ||
    profile.email;

  return {
    id: profile.userId,
    name,
    email: profile.email,
    role: "student",
    phone: profile.phone ?? undefined,
    notifications: { ...DEFAULT_NOTIFICATIONS },
    publicProfile: mapPublicProfile(profile, firstName, lastName, middleName),
  };
}

function mapHrProfile(profile: HrProfileDto): AuthUser {
  const firstName = profile.firstName ?? "";
  const lastName = profile.lastName ?? "";
  const middleName = profile.middleName ?? "";
  const name =
    [firstName, lastName, middleName].filter(Boolean).join(" ").trim() ||
    profile.companyName ||
    profile.email;

  return {
    id: profile.userId,
    name,
    email: profile.email,
    role: "hr",
    phone: profile.phone ?? undefined,
    notifications: { ...DEFAULT_NOTIFICATIONS },
    publicProfile: {
      avatarUrl: undefined,
      firstName,
      lastName,
      middleName: middleName || undefined,
      university: "",
      faculty: "",
      course: "1",
      city: "",
      bio: "",
      socialLinks: { ...DEFAULT_SOCIAL_LINKS },
      profileViews30d: 0,
      visibleAchievementIds: [],
      visibleBadgeIds: [],
    },
    organizerProfile: mapHrAsOrganizerProfile(profile, name, profile.email),
    organizerNotifications: { ...DEFAULT_ORGANIZER_NOTIFICATIONS },
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
    shortName:
      organizer?.shortName ?? organizer?.organizationName ?? fallbackName,
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

function normalizeOrganizationType(
  raw: unknown,
): OrganizerOrganizationProfile["organizationType"] {
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
