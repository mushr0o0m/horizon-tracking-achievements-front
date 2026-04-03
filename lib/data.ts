import type { Achievement, Student, AchievementLevel } from "./types";

export const CURRENT_STUDENT: Student = {
  id: "student-1",
  name: "Иванов Алексей Сергеевич",
  faculty: "Факультет информационных технологий",
  course: 3,
};

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach-1",
    title: "Международная олимпиада по информатике",
    level: "Международный",
    date: "2023-07-18",
    result: "Бронзовая медаль",
    status: "Подтверждено",
    studentId: "student-1",
    eventId: "evt-1",
    eventType: "Олимпиада",
    source: "organizer",
  },
  {
    id: "ach-2",
    title: "Всероссийский чемпионат по программированию",
    level: "Всероссийский",
    date: "2023-03-05",
    result: "1 место",
    status: "Подтверждено",
    studentId: "student-1",
    eventId: "evt-2",
    eventType: "Чемпионат",
    source: "organizer",
  },
  {
    id: "ach-3",
    title: "Региональная олимпиада по математике",
    level: "Региональный",
    date: "2024-02-14",
    result: "2 место",
    status: "Подтверждено",
    studentId: "student-1",
    eventId: "evt-3",
    eventType: "Олимпиада",
    source: "organizer",
  },
  {
    id: "ach-4",
    title: "Университетский хакатон",
    level: "Вузовский",
    date: "2024-04-22",
    result: "Лучшая инновация",
    status: "На проверке",
    studentId: "student-1",
    studentName: "Иванов Алексей Сергеевич",
    requestedOrganizerId: "organizer-demo",
    eventType: "Хакатон",
    source: "manual",
  },
];

// Scoring weights for metrics
export const LEVEL_SCORES: Record<AchievementLevel, number> = {
  Международный: 5,
  Всероссийский: 3,
  Региональный: 1,
  Вузовский: 0,
  Факультетский: 0,
};

export const LEVEL_ORDER: Record<AchievementLevel, number> = {
  Международный: 5,
  Всероссийский: 4,
  Региональный: 3,
  Вузовский: 2,
  Факультетский: 1,
};

export const CHART_DATA = [
  { year: "2021", participations: 2 },
  { year: "2022", participations: 4 },
  { year: "2023", participations: 6 },
  { year: "2024", participations: 3 },
  { year: "2025", participations: 1 },
];
