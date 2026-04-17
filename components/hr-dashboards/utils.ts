import { BADGE_DEFINITIONS } from "@/lib/badges";
import { hasHrCandidateAchievementUpdate } from "@/lib/hr-network";
import {
  getHrManualArchivedCandidatesMap,
  getHrCandidateNote,
  getHrCandidateStatusHistory,
  getHrCandidateStatusOverrides,
  getHrRecentActions,
  HrFunnelStatus,
} from "@/lib/hr-funnel";
import {
  ACHIEVEMENTS_STORAGE_KEY,
  AUTH_USERS_KEY,
  HR_INVITATIONS_STORAGE_KEY,
  KANBAN_STATUSES,
  THIRTY_DAYS_IN_MS,
} from "@/components/hr-dashboards/constants";
import {
  DashboardSnapshot,
  KanbanStatus,
  StatusCounts,
  StatusUpdateWindow,
  StoredAchievementLite,
  StoredInvitationLite,
  StoredUserLite,
} from "@/components/hr-dashboards/types";

function buildEmptyFunnelData() {
  return {
    "На рассмотрении": [],
    Интересует: [],
    Приглашён: [],
    "Ответили на приглашение": [],
    Отклонён: [],
  };
}

function buildEmptyStatusCounts(): StatusCounts {
  return {
    "На рассмотрении": 0,
    Интересует: 0,
    Приглашён: 0,
    "Ответили на приглашение": 0,
    Отклонён: 0,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatCourse(rawCourse: string): string {
  if (!rawCourse) return "Курс не указан";

  const specialMap: Record<string, string> = {
    graduate: "Выпускник",
    magister: "Магистр",
    postgraduate: "Аспирант",
  };

  if (specialMap[rawCourse]) {
    return specialMap[rawCourse];
  }

  return `${rawCourse} курс`;
}

function isKanbanStatus(status: HrFunnelStatus): status is KanbanStatus {
  return KANBAN_STATUSES.includes(status as KanbanStatus);
}

function parseStoredUsers(): StoredUserLite[] {
  if (typeof window === "undefined") return [];

  const parsed = parseJson(localStorage.getItem(AUTH_USERS_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry): StoredUserLite | null => {
      if (!isRecord(entry)) return null;

      const rawUser = entry.user ?? entry.student;
      if (!isRecord(rawUser)) return null;

      const id = typeof rawUser.id === "string" ? rawUser.id : "";
      const name = typeof rawUser.name === "string" ? rawUser.name : "";
      const email = typeof rawUser.email === "string" ? rawUser.email : "";
      const role = typeof rawUser.role === "string" ? rawUser.role : "";
      if (!id || !name || !role) return null;

      const publicProfile = isRecord(rawUser.publicProfile)
        ? rawUser.publicProfile
        : null;

      const university =
        publicProfile && typeof publicProfile.university === "string"
          ? publicProfile.university
          : "";
      const faculty =
        publicProfile && typeof publicProfile.faculty === "string"
          ? publicProfile.faculty
          : "";
      const course =
        publicProfile && typeof publicProfile.course === "string"
          ? publicProfile.course
          : "";
      const visibleBadgeIds =
        publicProfile && Array.isArray(publicProfile.visibleBadgeIds)
          ? publicProfile.visibleBadgeIds.filter(
              (item): item is string => typeof item === "string",
            )
          : [];

      return {
        id,
        name,
        email,
        role,
        university,
        faculty,
        course,
        visibleBadgeIds,
      };
    })
    .filter((item): item is StoredUserLite => item !== null);
}

function parseStoredAchievements(): StoredAchievementLite[] {
  if (typeof window === "undefined") return [];

  const parsed = parseJson(localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item): StoredAchievementLite | null => {
      if (!isRecord(item)) return null;
      const studentId =
        typeof item.studentId === "string" ? item.studentId : "";
      const status = typeof item.status === "string" ? item.status : "";
      if (!studentId || !status) return null;
      return { studentId, status };
    })
    .filter((item): item is StoredAchievementLite => item !== null);
}

function parseStoredInvitations(): StoredInvitationLite[] {
  if (typeof window === "undefined") return [];

  const parsed = parseJson(localStorage.getItem(HR_INVITATIONS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item): StoredInvitationLite | null => {
      if (!isRecord(item)) return null;

      const id = typeof item.id === "string" ? item.id : "";
      const candidateId =
        typeof item.candidateId === "string" ? item.candidateId : "";
      const status = item.status;
      const createdAt =
        typeof item.createdAt === "string" ? item.createdAt : "";
      const respondedAt =
        typeof item.respondedAt === "string" ? item.respondedAt : undefined;

      if (!id || !candidateId || !createdAt) return null;
      if (
        status !== "pending" &&
        status !== "accepted" &&
        status !== "rejected"
      ) {
        return null;
      }

      return {
        id,
        candidateId,
        status,
        createdAt,
        respondedAt,
      };
    })
    .filter((item): item is StoredInvitationLite => item !== null);
}

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

export function buildDashboardSnapshot(
  statusUpdateWindowDays: StatusUpdateWindow,
  hrId?: string,
): DashboardSnapshot {
  const users = parseStoredUsers();
  const students = users.filter((item) => item.role === "student");
  const achievements = parseStoredAchievements();
  const invitations = parseStoredInvitations();
  const statusOverrides = getHrCandidateStatusOverrides();
  const manualArchiveMap = getHrManualArchivedCandidatesMap();
  const recentActions = getHrRecentActions().slice(0, 20);

  const statsByStudentId = new Map<
    string,
    { confirmed: number; total: number }
  >();

  achievements.forEach((achievement) => {
    const stats = statsByStudentId.get(achievement.studentId) ?? {
      confirmed: 0,
      total: 0,
    };

    stats.total += 1;
    if (achievement.status === "Подтверждено") {
      stats.confirmed += 1;
    }

    statsByStudentId.set(achievement.studentId, stats);
  });

  const funnelData = buildEmptyFunnelData();
  const archiveCandidates = [];

  students.forEach((student) => {
    const status = statusOverrides[student.id] ?? "Не отслеживается";
    if (!isKanbanStatus(status)) return;

    const manualArchiveEntry = manualArchiveMap[student.id] ?? null;

    const latestStatusUpdateAt = getHrCandidateStatusHistory(student.id)[0]
      ?.changedAt;

    const latestRelevantDate = manualArchiveEntry
      ? manualArchiveEntry.archivedAt
      : latestStatusUpdateAt;

    if (
      latestRelevantDate &&
      !isWithinStatusWindow(latestRelevantDate, statusUpdateWindowDays)
    ) {
      return;
    }

    const stats = statsByStudentId.get(student.id) ?? {
      confirmed: 0,
      total: 0,
    };

    const badges = student.visibleBadgeIds
      .map(
        (badgeId) =>
          BADGE_DEFINITIONS.find((badge) => badge.id === badgeId) ?? null,
      )
      .filter(
        (badge): badge is (typeof BADGE_DEFINITIONS)[number] => badge !== null,
      )
      .slice(0, 4)
      .map((badge) => ({ id: badge.id, title: badge.title, icon: badge.icon }));

    const candidate = {
      id: student.id,
      name: student.name,
      email: student.email,
      university: student.university || "Вуз не указан",
      faculty: student.faculty || "Факультет не указан",
      course: formatCourse(student.course),
      totalAchievements: stats.total,
      confirmedAchievements: stats.confirmed,
      badges,
      note: getHrCandidateNote(student.id),
      hasNewAchievement: hrId
        ? hasHrCandidateAchievementUpdate(hrId, student.id)
        : false,
    };

    if (manualArchiveEntry) {
      archiveCandidates.push({
        ...candidate,
        archiveSource: "manual",
        archivedAt: manualArchiveEntry.archivedAt,
        staleDays: Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(manualArchiveEntry.archivedAt).getTime()) /
              (24 * 60 * 60 * 1000),
          ),
        ),
        archiveReason: manualArchiveEntry.note,
      });
      return;
    }

    const latestPendingInvitation = invitations
      .filter(
        (item) => item.candidateId === student.id && item.status === "pending",
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    const staleMs = latestPendingInvitation
      ? Date.now() - new Date(latestPendingInvitation.createdAt).getTime()
      : 0;

    const shouldMoveToArchive =
      status === "Приглашён" &&
      Boolean(latestPendingInvitation) &&
      Number.isFinite(staleMs) &&
      staleMs >= THIRTY_DAYS_IN_MS;

    if (shouldMoveToArchive && latestPendingInvitation) {
      archiveCandidates.push({
        ...candidate,
        archiveSource: "stale-invitation",
        archivedAt: latestPendingInvitation.createdAt,
        staleDays: Math.floor(staleMs / (24 * 60 * 60 * 1000)),
        invitationCreatedAt: latestPendingInvitation.createdAt,
      });
      return;
    }

    funnelData[status].push(candidate);
  });

  KANBAN_STATUSES.forEach((status) => {
    funnelData[status].sort(
      (a, b) => b.confirmedAchievements - a.confirmedAchievements,
    );
  });

  archiveCandidates.sort(
    (a, b) =>
      new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime(),
  );

  const byStatus = buildEmptyStatusCounts();
  KANBAN_STATUSES.forEach((status) => {
    byStatus[status] = funnelData[status].length;
  });

  const inFunnelCount = KANBAN_STATUSES.reduce(
    (sum, status) => sum + byStatus[status],
    0,
  );

  const activeCount =
    byStatus["На рассмотрении"] +
    byStatus["Интересует"] +
    byStatus["Приглашён"] +
    byStatus["Ответили на приглашение"];

  const confirmedAchievementsCount = KANBAN_STATUSES.flatMap(
    (status) => funnelData[status],
  ).reduce((sum, candidate) => sum + candidate.confirmedAchievements, 0);

  return {
    funnelData,
    archiveCandidates,
    recentActions,
    metrics: {
      inFunnelCount,
      activeCount,
      confirmedAchievementsCount,
      byStatus,
    },
  };
}
