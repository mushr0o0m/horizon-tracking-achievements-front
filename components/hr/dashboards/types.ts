import { HrFunnelStatus } from "@/lib/hr-funnel";

export type KanbanStatus = Exclude<HrFunnelStatus, "Не отслеживается">;
export type StatusUpdateWindow = 1 | 7 | 30;
export type RecentActionType = "all" | "status" | "invite" | "notes";

export interface StoredUserLite {
  id: string;
  name: string;
  email: string;
  role: string;
  university: string;
  faculty: string;
  course: string;
  visibleBadgeIds: string[];
}

export interface StoredAchievementLite {
  studentId: string;
  status: string;
}

export interface StoredInvitationLite {
  id: string;
  candidateId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  respondedAt?: string;
}

export interface FunnelCandidate {
  id: string;
  name: string;
  email: string;
  university: string;
  faculty: string;
  course: string;
  totalAchievements: number;
  confirmedAchievements: number;
  badges: Array<{ id: string; title: string; icon: string }>;
  note: string;
  hasNewAchievement: boolean;
}

export interface ArchiveCandidate extends FunnelCandidate {
  archiveSource: "stale-invitation" | "manual";
  archivedAt: string;
  staleDays?: number;
  invitationCreatedAt?: string;
  archiveReason?: string;
}

export interface QuickSearchRow extends FunnelCandidate {
  status: KanbanStatus;
}

export type FunnelData = Record<KanbanStatus, FunnelCandidate[]>;
export type StatusCounts = Record<KanbanStatus, number>;

export interface DashboardMetrics {
  inFunnelCount: number;
  activeCount: number;
  confirmedAchievementsCount: number;
  byStatus: StatusCounts;
}

export interface DashboardSnapshot {
  funnelData: FunnelData;
  archiveCandidates: ArchiveCandidate[];
  recentActions: string[];
  metrics: DashboardMetrics;
}
