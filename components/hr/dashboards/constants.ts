import { KanbanStatus, RecentActionType, StatusUpdateWindow } from "@/components/hr/dashboards/types";

export const KANBAN_STATUSES: KanbanStatus[] = [
  "На рассмотрении",
  "Интересует",
  "Приглашён",
  "Ответили на приглашение",
  "Отклонён",
];

export const ALLOWED_TRANSITIONS: Record<KanbanStatus, KanbanStatus[]> = {
  "На рассмотрении": ["Интересует", "Отклонён"],
  Интересует: ["Приглашён", "Отклонён"],
  Приглашён: ["Отклонён"],
  "Ответили на приглашение": ["Отклонён"],
  Отклонён: ["На рассмотрении", "Интересует", "Приглашён"],
};

export const COLUMN_DESCRIPTIONS: Record<KanbanStatus, string> = {
  "На рассмотрении": "Новые кандидаты, которых HR еще не оценил.",
  Интересует: "Кандидаты, которых HR хочет отслеживать дальше.",
  Приглашён: "Кандидатам отправлено приглашение.",
  "Ответили на приглашение": "Кандидаты, которые ответили на приглашение HR.",
  Отклонён: "Кандидаты, которые не подошли.",
};

export const STATUS_UPDATE_FILTER_OPTIONS: Array<{
  value: StatusUpdateWindow;
  label: string;
}> = [
  { value: 30, label: "За 30 дней" },
  { value: 7, label: "За 7 дней" },
  { value: 1, label: "За 1 день" },
];

export const COLUMN_THEME: Record<
  KanbanStatus,
  { header: string; border: string; surface: string; gradient: string }
> = {
  "На рассмотрении": {
    header: "bg-slate-100 text-slate-700",
    border: "border-slate-200",
    surface: "bg-slate-50",
    gradient: "bg-gradient-to-b from-slate-100/70 via-slate-50 to-background",
  },
  Интересует: {
    header: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    surface: "bg-amber-50",
    gradient: "bg-gradient-to-b from-amber-100/70 via-amber-50 to-background",
  },
  Приглашён: {
    header: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    surface: "bg-emerald-50",
    gradient: "bg-gradient-to-b from-emerald-100/70 via-emerald-50 to-background",
  },
  "Ответили на приглашение": {
    header: "bg-indigo-100 text-indigo-700",
    border: "border-indigo-200",
    surface: "bg-indigo-50",
    gradient: "bg-gradient-to-b from-indigo-100/70 via-indigo-50 to-background",
  },
  Отклонён: {
    header: "bg-rose-100 text-rose-700",
    border: "border-rose-200",
    surface: "bg-rose-50",
    gradient: "bg-gradient-to-b from-rose-100/70 via-rose-50 to-background",
  },
};

export const RECENT_ACTION_FILTERS: Array<{ id: RecentActionType; label: string }> = [
  { id: "all", label: "Все" },
  { id: "status", label: "Статусы" },
  { id: "invite", label: "Приглашения" },
  { id: "notes", label: "Заметки" },
];

export const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
