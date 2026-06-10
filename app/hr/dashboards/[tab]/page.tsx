"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { HrDashboardsKanbanPageContent } from "@/app/hr/dashboards/kanban/page";
import type { HrActionConfirmSettings } from "@/lib/hr-network";
import type { HrFunnelStatus } from "@/lib/hr-funnel";
import type { HrDashboardTab } from "@/app/shared/routing/app-shell-routes";

interface HrDashboardsTabPageProps {
  hrId?: string;
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

export function HrDashboardsTabPageContent({
  hrId,
  defaultInviteComment,
  actionConfirmSettings,
  onSaveCandidateNote,
  onOpenCandidate,
  onChangeCandidateStatus,
  onInviteCandidate,
  onArchiveCandidate,
  activeTab,
  onTabChange,
}: HrDashboardsTabPageProps) {
  if (
    !hrId ||
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
    <HrDashboardsKanbanPageContent
      hrId={hrId}
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
