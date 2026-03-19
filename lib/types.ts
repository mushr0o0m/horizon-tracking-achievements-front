// Russian level names
export type AchievementLevel =
  | "Международный"
  | "Всероссийский"
  | "Региональный"
  | "Вузовский"
  | "Факультетский";

export type AchievementStatus = "Подтверждено" | "На проверке";

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
  source: "organizer" | "simulated";
}

export interface Student {
  id: string;
  name: string;
  faculty: string;
  course: number;
  avatarUrl?: string;
}

export type EventType = "Олимпиада" | "Конкурс" | "Хакатон" | "Конференция" | "Чемпионат" | "Другое";

export interface Event {
  id: string;
  title: string;
  level: AchievementLevel;
  date: string;
  type: EventType;
  description?: string;
  status: "Черновик" | "Опубликовано";
  participantCount: number;
}

export interface Participant {
  id: string;
  studentId: string;
  studentName: string;
  result: string;
}

export type UserRole = "student" | "organizer";
export type StudentView = "home" | "dashboards" | "achievements";
export type OrganizerView = "events" | "create-event" | "edit-event" | "upload-results";
