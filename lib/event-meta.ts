import {
  AchievementLevel,
  Event,
  EventType,
  OrganizerEventFormat,
  OrganizerEventLevel,
  OrganizerEventStatus,
  OrganizerEventType,
} from "@/lib/types";

const DEFAULT_API_BASE = "http://37.230.169.107/api";

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

export function buildPublicEventPath(eventId: string): string {
  return `/public/event/${encodeURIComponent(eventId)}`;
}

export function buildPublicEventUrl(eventId: string, origin?: string): string {
  const path = buildPublicEventPath(eventId);
  if (!origin) return path;
  return `${origin.replace(/\/$/, "")}${path}`;
}

export function resolvePublicEventShareUrl(eventId: string): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    return buildPublicEventUrl(eventId, configuredAppUrl);
  }

  if (typeof window === "undefined") {
    return buildPublicEventPath(eventId);
  }

  const currentHref = window.location.href;
  const expectedPath = buildPublicEventPath(eventId);

  try {
    const currentUrl = new URL(currentHref);
    if (currentUrl.pathname.endsWith(expectedPath)) {
      currentUrl.hash = "";
      return currentUrl.toString();
    }
  } catch {
    return buildPublicEventUrl(eventId, window.location.origin);
  }

  return buildPublicEventUrl(eventId, window.location.origin);
}

export function buildEventQrCode(eventId: string): string {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const publicEventUrl = buildPublicEventUrl(eventId, appOrigin);
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicEventUrl)}`;
}

export function resolveEventQrCodeUrl(
  qrCodeUrl: string,
  options?: { baseUrl?: string },
): string {
  if (!qrCodeUrl) return "";
  const requestedBaseUrl = options?.baseUrl?.trim();
  const fallbackBackendBaseUrl = (() => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE).trim();
    if (!apiBase) return "";
    try {
      return new URL(apiBase).origin;
    } catch {
      return "";
    }
  })();
  const baseUrlForQuery = requestedBaseUrl || fallbackBackendBaseUrl;

  const withBaseUrl = (value: string): string => {
    if (!baseUrlForQuery) return value;
    try {
      const parsed = new URL(value);
      if (!parsed.searchParams.has("baseUrl")) {
        parsed.searchParams.set("baseUrl", baseUrlForQuery);
      }
      return parsed.toString();
    } catch {
      const separator = value.includes("?") ? "&" : "?";
      return `${value}${separator}baseUrl=${encodeURIComponent(baseUrlForQuery)}`;
    }
  };

  if (
    qrCodeUrl.startsWith("http://") ||
    qrCodeUrl.startsWith("https://") ||
    qrCodeUrl.startsWith("data:")
  ) {
    return withBaseUrl(qrCodeUrl);
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE).replace(
    /\/$/,
    "",
  );
  if (!apiBase) return withBaseUrl(qrCodeUrl);

  if (qrCodeUrl.startsWith("/")) {
    try {
      const origin = new URL(apiBase).origin;
      return withBaseUrl(`${origin}${qrCodeUrl}`);
    } catch {
      return withBaseUrl(qrCodeUrl);
    }
  }

  return withBaseUrl(`${apiBase}/${qrCodeUrl.replace(/^\//, "")}`);
}

export function formatEventPeriod(event: Event): string {
  return `${new Date(event.dates.start).toLocaleDateString("ru-RU")} - ${new Date(event.dates.end).toLocaleDateString("ru-RU")}`;
}
