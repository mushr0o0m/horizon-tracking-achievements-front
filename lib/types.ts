// Russian level names
export type AchievementLevel =
  | "Международный"
  | "Всероссийский"
  | "Региональный"
  | "Вузовский"
  | "Факультетский";

export type AchievementStatus = "Подтверждено" | "На проверке" | "Отклонено";

export interface Achievement {
  id: string;
  title: string;
  level: AchievementLevel;
  date: string; // ISO date string YYYY-MM-DD
  result: string;
  status: AchievementStatus;
  eventId?: string; // Links to organizing event
  eventType?: EventType;
  studentId: string;
  studentName?: string;
  requestedOrganizerId?: string;
  eventNotInList?: boolean;
  requestComment?: string;
  verificationComment?: string;
  source: "organizer" | "simulated" | "manual";
}

export interface Student {
  id: string;
  name: string;
  faculty: string;
  course: number;
  avatarUrl?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  notifications: NotificationSettings;
  publicProfile: PublicProfile;
  organizerProfile?: OrganizerOrganizationProfile;
  organizerNotifications?: OrganizerNotificationSettings;
}

export interface NotificationSettings {
  invitations: boolean;
  verification: boolean;
  recommendations: boolean;
}

export type OrganizerNotificationChannel =
  | "interface"
  | "email"
  | "push"
  | "telegram";

export interface OrganizerNotificationSettings {
  verificationRequests: boolean;
  newRegistrations: boolean;
  reports: boolean;
  deliveryChannels: OrganizerNotificationChannel[];
}

export type OrganizationType =
  | "university"
  | "scientific"
  | "olympiad"
  | "conference"
  | "foundation"
  | "educational"
  | "other";

export interface OrganizerSocialLinks {
  telegram: string;
  vk: string;
  youtube: string;
  other: string[];
}

export interface OrganizerOrganizationProfile {
  logoUrl?: string;
  organizationName: string;
  shortName: string;
  organizationType: OrganizationType;
  website: string;
  description: string;
  contactEmail: string;
  contactPhone?: string;
  socialLinks: OrganizerSocialLinks;
  foundedYear?: number;
  eventsCount: number;
  totalParticipants: number;
}

export type CourseOption =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "graduate"
  | "magister"
  | "postgraduate";

export interface SocialLinks {
  telegram: string;
  github: string;
  linkedin: string;
  website: string;
  customLinks: string[];
}

export interface PublicProfile {
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  university: string;
  faculty: string;
  course: CourseOption;
  city: string;
  bio: string;
  socialLinks: SocialLinks;
  profileViews30d: number;
  visibleAchievementIds: string[];
  visibleBadgeIds: string[];
}

export type AppNotificationType =
  | "achievement"
  | "event"
  | "system"
  | "message";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: AppNotificationType;
  createdAt: string;
  isRead: boolean;
}

export type OrganizerEventType =
  | "olympiad"
  | "conference"
  | "hackathon"
  | "course"
  | "volunteering"
  | "other";

export type OrganizerEventLevel =
  | "international"
  | "national"
  | "regional"
  | "university"
  | "school";

export type OrganizerEventFormat = "offline" | "online" | "hybrid";

export type OrganizerEventStatus =
  | "draft"
  | "published"
  | "completed"
  | "cancelled";

export type EventType =
  | "Олимпиада"
  | "Конкурс"
  | "Хакатон"
  | "Конференция"
  | "Чемпионат"
  | "Другое";

export interface EventDates {
  start: string;
  end: string;
  registrationDeadline: string;
}

export interface EventCustomField {
  id: string;
  label: string;
  type: "text" | "select" | "file";
  required: boolean;
  options?: string[];
}

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  type: OrganizerEventType;
  level: OrganizerEventLevel;
  dates: EventDates;
  format: OrganizerEventFormat;
  location?: string;
  description: string;
  website: string;
  contactEmail: string;
  logoUrl: string;
  bannerUrl: string;
  qrCodeUrl: string;
  status: OrganizerEventStatus;
  participantsCount: number;
  customFields: EventCustomField[];
  createdAt: string;
}

export interface EventApplication {
  id: string;
  eventId: string;
  studentId: string;
  studentName: string;
  appliedAt: string;
}

export interface Participant {
  id: string;
  studentId: string;
  studentName: string;
  result: string;
}

export type UserRole = "student" | "organizer";
export type StudentView =
  | "home"
  | "dashboards"
  | "achievements"
  | "create-achievement"
  | "profile"
  | "event-details";
export type OrganizerView =
  | "events"
  | "verification-requests"
  | "profile"
  | "create-event"
  | "edit-event"
  | "upload-results"
  | "event-details";
