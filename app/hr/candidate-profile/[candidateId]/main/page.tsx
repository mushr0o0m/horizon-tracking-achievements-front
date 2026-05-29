"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { HrCandidateProfilePage, type HrInvitationPayload } from "@/components/hr/hr-candidate-profile-page";
import type { Achievement, AuthUser, Event } from "@/lib/types";
import type { HrFunnelStatus, HrStatusHistoryEntry } from "@/lib/hr-funnel";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import { Spinner } from "@/components/ui/spinner";

interface HrCandidateProfileMainPageProps {
  candidate?: AuthUser | null;
  achievements?: Achievement[];
  events?: Event[];
  candidateStatus?: HrFunnelStatus;
  statusHistory?: HrStatusHistoryEntry[];
  savedNote?: string;
  defaultInviteComment?: string;
  subscribers?: SubscriberPreviewItem[];
  isCurrentHrSubscribed?: boolean;
  onBackToPreviousPage?: () => void;
  onOpenEvent?: (eventId: string) => void;
  onSaveNote?: (note: string) => void;
  onInvite?: (payload: HrInvitationPayload) => string | null | Promise<string | null>;
  onToggleSubscription?: () => void;
  onOpenSubscribers?: () => void;
  onAddToFunnel?: () => string | null | Promise<string | null>;
  isLoading?: boolean;
}

export function HrCandidateProfileMainPageContent({
  candidate,
  achievements,
  events,
  candidateStatus,
  statusHistory,
  savedNote,
  defaultInviteComment,
  subscribers,
  isCurrentHrSubscribed,
  onBackToPreviousPage,
  onOpenEvent,
  onSaveNote,
  onInvite,
  onToggleSubscription,
  onOpenSubscribers,
  onAddToFunnel,
  isLoading = false,
}: HrCandidateProfileMainPageProps) {
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Spinner className="size-8" />
          <span className="text-sm">Загружаем профиль кандидата...</span>
        </div>
      </div>
    );
  }

  if (
    candidate === undefined ||
    !achievements ||
    !events ||
    !candidateStatus ||
    !statusHistory ||
    savedNote === undefined ||
    defaultInviteComment === undefined ||
    !subscribers ||
    isCurrentHrSubscribed === undefined ||
    !onBackToPreviousPage ||
    !onOpenEvent ||
    !onSaveNote ||
    !onInvite ||
    !onToggleSubscription ||
    !onOpenSubscribers ||
    !onAddToFunnel
  ) {
    return <AppShellCommon />;
  }

  return (
    <HrCandidateProfilePage
      candidate={candidate}
      achievements={achievements}
      events={events}
      candidateStatus={candidateStatus}
      statusHistory={statusHistory}
      savedNote={savedNote}
      defaultInviteComment={defaultInviteComment}
      subscribers={subscribers}
      isCurrentHrSubscribed={isCurrentHrSubscribed}
      onBackToPreviousPage={onBackToPreviousPage}
      onOpenEvent={onOpenEvent}
      onSaveNote={onSaveNote}
      onInvite={onInvite}
      onToggleSubscription={onToggleSubscription}
      onOpenSubscribers={onOpenSubscribers}
      onAddToFunnel={onAddToFunnel}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
