export type HrFunnelStatus =
  | "Не отслеживается"
  | "На рассмотрении"
  | "Интересует"
  | "Приглашён"
  | "Ответили на приглашение"
  | "Отклонён";

export interface HrStatusHistoryEntry {
  id: string;
  candidateId: string;
  fromStatus: HrFunnelStatus;
  toStatus: HrFunnelStatus;
  changedAt: string;
  actorName?: string;
  note?: string;
}

export interface HrManualArchiveEntry {
  candidateId: string;
  archivedAt: string;
  actorName?: string;
  note?: string;
}

export const HR_FUNNEL_STATUSES: HrFunnelStatus[] = [
  "Не отслеживается",
  "На рассмотрении",
  "Интересует",
  "Приглашён",
  "Ответили на приглашение",
  "Отклонён",
];

export function isHrFunnelStatus(value: unknown): value is HrFunnelStatus {
  return (
    typeof value === "string" &&
    (HR_FUNNEL_STATUSES as string[]).includes(value)
  );
}

export function deriveHrFunnelStatusFromAchievementStats(stats: {
  confirmed: number;
  pending: number;
  rejected: number;
}): HrFunnelStatus {
  if (stats.pending > 0) return "На рассмотрении";
  if (stats.confirmed > 0) return "Интересует";
  if (stats.rejected > 0) return "Отклонён";
  return "Не отслеживается";
}
