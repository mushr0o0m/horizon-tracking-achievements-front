import type {
  AchievementLevel,
  EventType,
  OrganizerEventLevel,
  OrganizerEventType,
} from "@/lib/types";

export const ACHIEVEMENT_EVENT_TO_ORGANIZER_TYPE: Record<
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

export const ACHIEVEMENT_LEVEL_TO_ORGANIZER_LEVEL: Record<
  AchievementLevel,
  OrganizerEventLevel
> = {
  Международный: "international",
  Всероссийский: "national",
  Региональный: "regional",
  Вузовский: "university",
  Факультетский: "school",
};
