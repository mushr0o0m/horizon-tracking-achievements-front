import { HR_FUNNEL_STATUSES, type HrFunnelStatus } from "@/lib/hr-funnel";

const HR_KANBAN_STATUSES = [
  "На рассмотрении",
  "Интересует",
  "Приглашён",
  "Ответили на приглашение",
  "Отклонён",
] as const;

type HrKanbanStatus = (typeof HR_KANBAN_STATUSES)[number];

const HR_STATUS_TRANSITIONS: Record<HrKanbanStatus, HrKanbanStatus[]> = {
  "На рассмотрении": ["Интересует", "Отклонён"],
  Интересует: ["Приглашён", "Отклонён"],
  Приглашён: ["Ответили на приглашение", "Отклонён"],
  "Ответили на приглашение": ["Отклонён"],
  Отклонён: [...HR_KANBAN_STATUSES],
};

export function isHrKanbanStatus(status: HrFunnelStatus): status is HrKanbanStatus {
  return HR_KANBAN_STATUSES.includes(status as HrKanbanStatus);
}

export function canMoveHrCandidateStatus(
  fromStatus: HrFunnelStatus,
  toStatus: HrFunnelStatus,
): boolean {
  if (!isHrKanbanStatus(fromStatus) || !isHrKanbanStatus(toStatus)) {
    return false;
  }

  return HR_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

export function isKnownHrFunnelStatus(status: string): status is HrFunnelStatus {
  return HR_FUNNEL_STATUSES.includes(status as HrFunnelStatus);
}
