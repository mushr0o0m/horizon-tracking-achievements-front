import type {
  AuthUser,
  CourseOption,
  NotificationSettings,
  OrganizerNotificationChannel,
  OrganizerNotificationSettings,
  OrganizerOrganizationProfile,
  OrganizerSocialLinks,
  OrganizationType,
  PublicProfile,
  SocialLinks,
  UserRole,
} from "@/lib/types";

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

const DEFAULT_ORGANIZER_NOTIFICATION_CHANNELS: OrganizerNotificationChannel[] = [
  "interface",
  "email",
];
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

export function normalizeOrganizerNotifications(
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

export function normalizeUser(raw: unknown): AuthUser | null {
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
