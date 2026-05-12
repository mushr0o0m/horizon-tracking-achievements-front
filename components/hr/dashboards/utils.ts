import { StatusUpdateWindow } from "@/components/hr/dashboards/types";

export function isWithinStatusWindow(
  dateValue: string,
  days: StatusUpdateWindow,
): boolean {
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

export function parseRecentActionTimestamp(action: string): number | null {
  const match = action.match(
    /^(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (!match) return null;

  const [, day, month, year, hour, minute, second = "0"] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime();
}

export function isRecentActionWithinWindow(
  action: string,
  days: StatusUpdateWindow,
): boolean {
  const timestamp = parseRecentActionTimestamp(action);
  if (timestamp === null) return true;
  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
}

export function getRecentActionType(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes("приглаш")) {
    return "invite" as const;
  }

  if (normalized.includes("заметк")) {
    return "notes" as const;
  }

  return "status" as const;
}
