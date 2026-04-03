import {
  AchievementLevel,
  Event,
  EventType,
  OrganizerEventFormat,
  OrganizerEventLevel,
  OrganizerEventStatus,
  OrganizerEventType,
} from "@/lib/types";

export const EVENT_LEVEL_TO_ACHIEVEMENT_LEVEL: Record<
  OrganizerEventLevel,
  AchievementLevel
> = {
  international: "Международный",
  national: "Всероссийский",
  regional: "Региональный",
  university: "Вузовский",
  school: "Факультетский",
};

export const EVENT_TYPE_TO_ACHIEVEMENT_TYPE: Record<
  OrganizerEventType,
  EventType
> = {
  olympiad: "Олимпиада",
  conference: "Конференция",
  hackathon: "Хакатон",
  course: "Конкурс",
  volunteering: "Другое",
  other: "Другое",
};

export const EVENT_LEVEL_LABELS: Record<OrganizerEventLevel, string> = {
  international: "Международный",
  national: "Всероссийский",
  regional: "Региональный",
  university: "Вузовский",
  school: "Школьный",
};

export const EVENT_TYPE_LABELS: Record<OrganizerEventType, string> = {
  olympiad: "Олимпиада",
  conference: "Конференция",
  hackathon: "Хакатон",
  course: "Курс",
  volunteering: "Волонтерство",
  other: "Другое",
};

export const EVENT_STATUS_LABELS: Record<OrganizerEventStatus, string> = {
  draft: "Черновик",
  published: "Опубликовано",
  completed: "Завершено",
  cancelled: "Отменено",
};

export const EVENT_LEVEL_COLORS: Record<OrganizerEventLevel, string> = {
  international: "bg-purple-100 text-purple-700",
  national: "bg-blue-100 text-blue-700",
  regional: "bg-cyan-100 text-cyan-700",
  university: "bg-green-100 text-green-700",
  school: "bg-gray-100 text-gray-700",
};

export const EVENT_STATUS_COLORS: Record<OrganizerEventStatus, string> = {
  draft: "bg-[var(--pending-bg)] text-[var(--pending)]",
  published: "bg-[var(--verified-bg)] text-[var(--verified)]",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export const EVENT_LEVEL_OPTIONS: Array<{
  value: OrganizerEventLevel;
  label: string;
}> = [
  { value: "international", label: "Международный" },
  { value: "national", label: "Всероссийский" },
  { value: "regional", label: "Региональный" },
  { value: "university", label: "Вузовский" },
  { value: "school", label: "Школьный" },
];

export const EVENT_TYPE_OPTIONS: Array<{
  value: OrganizerEventType;
  label: string;
}> = [
  { value: "olympiad", label: "Олимпиада" },
  { value: "conference", label: "Конференция" },
  { value: "hackathon", label: "Хакатон" },
  { value: "course", label: "Курс" },
  { value: "volunteering", label: "Волонтерство" },
  { value: "other", label: "Другое" },
];

export const EVENT_FORMAT_OPTIONS: Array<{
  value: OrganizerEventFormat;
  label: string;
}> = [
  { value: "offline", label: "Очно" },
  { value: "online", label: "Онлайн" },
  { value: "hybrid", label: "Гибрид" },
];

export const EVENT_STATUS_OPTIONS: Array<{
  value: OrganizerEventStatus;
  label: string;
}> = [
  { value: "draft", label: "Черновик" },
  { value: "published", label: "Опубликовано" },
  { value: "completed", label: "Завершено" },
  { value: "cancelled", label: "Отменено" },
];

export function buildEventQrCode(eventId: string): string {
  const publicEventUrl = `https://example.org/events/${eventId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicEventUrl)}`;
}

export function formatEventPeriod(event: Event): string {
  return `${new Date(event.dates.start).toLocaleDateString("ru-RU")} - ${new Date(event.dates.end).toLocaleDateString("ru-RU")}`;
}
