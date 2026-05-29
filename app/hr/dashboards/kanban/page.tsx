"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { HrDashboardsPage } from "@/components/hr/hr-dashboards-page";
import type { HrActionConfirmSettings } from "@/lib/hr-network";
import type { HrFunnelStatus } from "@/lib/hr-funnel";
import type { HrDashboardTab } from "@/app/shared/routing/app-shell-routes";

interface HrDashboardsKanbanPageProps {
  hrId?: string;
  publishedEventsCount?: number;
  defaultInviteComment?: string;
  actionConfirmSettings?: HrActionConfirmSettings;
  onSaveCandidateNote?: (candidateId: string, note: string) => Promise<void>;
  onOpenCandidate?: (candidateId: string) => void;
  onChangeCandidateStatus?: (
    candidateId: string,
    toStatus: Exclude<HrFunnelStatus, "Не отслеживается">,
    fromStatus?: Exclude<HrFunnelStatus, "Не отслеживается">,
  ) => string | null | Promise<string | null>;
  onInviteCandidate?: (
    candidateId: string,
    payload: {
      position: string;
      message: string;
      sendNow: boolean;
      scheduledAt?: string;
    },
    fromStatus?: Exclude<HrFunnelStatus, "Не отслеживается">,
  ) => string | null | Promise<string | null>;
  onArchiveCandidate?: (candidateId: string) => string | null | Promise<string | null>;
  activeTab?: HrDashboardTab;
  onTabChange?: (tab: HrDashboardTab) => void;
}

export function HrDashboardsKanbanPageContent({
  hrId,
  publishedEventsCount,
  defaultInviteComment,
  actionConfirmSettings,
  onSaveCandidateNote,
  onOpenCandidate,
  onChangeCandidateStatus,
  onInviteCandidate,
  onArchiveCandidate,
  activeTab,
  onTabChange,
}: HrDashboardsKanbanPageProps) {
  if (
    !hrId ||
    publishedEventsCount === undefined ||
    defaultInviteComment === undefined ||
    !actionConfirmSettings ||
    !onSaveCandidateNote ||
    !onOpenCandidate ||
    !onChangeCandidateStatus ||
    !onInviteCandidate ||
    !onArchiveCandidate
  ) {
    return <AppShellCommon />;
  }

  return (
    <HrDashboardsPage
      hrId={hrId}
      publishedEventsCount={publishedEventsCount}
      defaultInviteComment={defaultInviteComment}
      actionConfirmSettings={actionConfirmSettings}
      onSaveCandidateNote={onSaveCandidateNote}
      onOpenCandidate={onOpenCandidate}
      onChangeCandidateStatus={onChangeCandidateStatus}
      onInviteCandidate={onInviteCandidate}
      onArchiveCandidate={onArchiveCandidate}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
