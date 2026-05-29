"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleHelp, TriangleAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HrFunnelStatus } from "@/lib/hr-funnel";
import { KANBAN_STATUSES } from "@/components/hr/dashboards/constants";
import {
  FunnelCandidate,
  KanbanStatus,
  StatusUpdateWindow,
} from "@/components/hr/dashboards/types";
import { HrKanbanTab } from "@/components/hr/dashboards/tabs/kanban-tab";
import { HrSummaryTab } from "@/components/hr/dashboards/tabs/summary-tab";
import { HrQuickSearchTab } from "@/components/hr/dashboards/tabs/quick-search-tab";
import { HrRecentActionsTab } from "@/components/hr/dashboards/tabs/recent-actions-tab";
import { HrArchiveTab } from "@/components/hr/dashboards/tabs/archive-tab";
import { CandidateModal } from "@/components/hr/dashboards/candidate-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHrDashboardData } from "@/hooks/use-hr-dashboard-data";
import { useHrQuickSearch } from "@/hooks/use-hr-quick-search";
import { useHrRecentActionsFilter } from "@/hooks/use-hr-recent-actions-filter";
import { HrActionConfirmSettings } from "@/lib/hr-network";
import type { HrDashboardTab } from "@/app/shared/routing/app-shell-routes";

interface HrDashboardsPageProps {
  hrId: string;
  publishedEventsCount: number;
  defaultInviteComment: string;
  onSaveCandidateNote: (candidateId: string, note: string) => Promise<void>;
  onOpenCandidate: (candidateId: string) => void;
  onChangeCandidateStatus: (
    candidateId: string,
    toStatus: Exclude<HrFunnelStatus, "Не отслеживается">,
  ) => string | null | Promise<string | null>;
  onInviteCandidate: (
    candidateId: string,
    payload: {
      position: string;
      message: string;
      sendNow: boolean;
      scheduledAt?: string;
    },
  ) => string | null | Promise<string | null>;
  onArchiveCandidate: (candidateId: string) => string | null | Promise<string | null>;
  actionConfirmSettings: HrActionConfirmSettings;
  activeTab?: HrDashboardTab;
  onTabChange?: (tab: HrDashboardTab) => void;
}

export function HrDashboardsPage({
  hrId,
  publishedEventsCount,
  defaultInviteComment,
  onSaveCandidateNote,
  onOpenCandidate,
  onChangeCandidateStatus,
  onInviteCandidate,
  onArchiveCandidate,
  actionConfirmSettings,
  activeTab = "kanban",
  onTabChange,
}: HrDashboardsPageProps) {
  const [uncontrolledTab, setUncontrolledTab] =
    useState<HrDashboardTab>("kanban");
  const selectedTab = onTabChange ? activeTab : uncontrolledTab;
  const [statusUpdateWindowDays, setStatusUpdateWindowDays] =
    useState<StatusUpdateWindow>(30);
  const [message, setMessage] = useState<string | null>(null);
  const [columnStart, setColumnStart] = useState(0);

  const {
    funnelData,
    archiveCandidates,
    recentActions,
    metrics,
    isLoading,
    syncDashboardData,
  } = useHrDashboardData(statusUpdateWindowDays);

  const {
    searchQuery,
    setSearchQuery,
    setQuickSearchPage,
    quickSearchRows,
    quickSearchPageCount,
    safeQuickSearchPage,
    paginatedQuickSearchRows,
  } = useHrQuickSearch(funnelData);

  const {
    recentActionsFilter,
    setRecentActionsFilter,
    recentActionsQuery,
    setRecentActionsQuery,
    filteredRecentActions,
  } = useHrRecentActionsFilter(recentActions, statusUpdateWindowDays);

  const [modalCandidate, setModalCandidate] = useState<{
    candidate: FunnelCandidate;
    status: KanbanStatus;
  } | null>(null);
  const [modalNoteDraft, setModalNoteDraft] = useState("");
  const [isModalNoteOpen, setIsModalNoteOpen] = useState(true);
  const [modalNoteMessage, setModalNoteMessage] = useState<string | null>(null);
  const [isModalInviteOpen, setIsModalInviteOpen] = useState(false);
  const [invitePosition, setInvitePosition] = useState("");
  const [inviteComment, setInviteComment] = useState(defaultInviteComment);
  const [inviteSendNow, setInviteSendNow] = useState(true);
  const [inviteScheduledAt, setInviteScheduledAt] = useState("");
  const [inviteFormMessage, setInviteFormMessage] = useState<string | null>(
    null,
  );
  const [pendingWarningAction, setPendingWarningAction] = useState<{
    type: "reject" | "archive";
    candidateId: string;
    candidateName: string;
  } | null>(null);

  const maxColumnStart = Math.max(0, KANBAN_STATUSES.length - 4);

  useEffect(() => {
    if (columnStart > maxColumnStart) {
      setColumnStart(maxColumnStart);
    }
  }, [columnStart, maxColumnStart]);

  const visibleColumns = useMemo(
    () => KANBAN_STATUSES.slice(columnStart, columnStart + 4),
    [columnStart],
  );

  useEffect(() => {
    setInviteComment(defaultInviteComment);
  }, [defaultInviteComment]);

  const openCandidateModal = (
    candidate: FunnelCandidate,
    status: KanbanStatus,
  ) => {
    setModalCandidate({ candidate, status });
    setModalNoteDraft(candidate.note);
    setModalNoteMessage(null);
    setIsModalNoteOpen(true);
    setIsModalInviteOpen(false);
    setInvitePosition("");
    setInviteComment(defaultInviteComment);
    setInviteSendNow(true);
    setInviteScheduledAt("");
    setInviteFormMessage(null);
  };

  const closeCandidateModal = () => {
    setModalCandidate(null);
    setModalNoteDraft("");
    setModalNoteMessage(null);
    setIsModalNoteOpen(true);
    setIsModalInviteOpen(false);
    setInvitePosition("");
    setInviteComment(defaultInviteComment);
    setInviteSendNow(true);
    setInviteScheduledAt("");
    setInviteFormMessage(null);
    setPendingWarningAction(null);
  };

  const handleMoveCandidate = async (
    candidateId: string,
    toStatus: KanbanStatus,
  ) => {
    const error = await Promise.resolve(
      onChangeCandidateStatus(candidateId, toStatus),
    );
    if (error) {
      setMessage(error);
      return;
    }

    setMessage(null);
    closeCandidateModal();
    syncDashboardData();
  };

  const handleSaveModalNote = async () => {
    if (!modalCandidate) return;
    try {
      await onSaveCandidateNote(modalCandidate.candidate.id, modalNoteDraft);
      setModalNoteMessage("Заметка сохранена.");
      setModalCandidate((prev) =>
        prev
          ? {
              ...prev,
              candidate: {
                ...prev.candidate,
                note: modalNoteDraft,
              },
            }
          : prev,
      );
      syncDashboardData();
    } catch (error) {
      console.warn("Failed to save HR note.", error);
      setModalNoteMessage("Не удалось сохранить заметку.");
    }
  };

  const archiveCandidateFromModal = async () => {
    if (!modalCandidate) return;

    const error = await Promise.resolve(
      onArchiveCandidate(modalCandidate.candidate.id),
    );
    if (error) {
      setMessage(error);
      return;
    }

    setMessage(`Кандидат ${modalCandidate.candidate.name} перемещен в архив.`);
    closeCandidateModal();
    syncDashboardData();
  };

  const handleModalTransition = (nextStatus: KanbanStatus) => {
    if (!modalCandidate) return;

    if (nextStatus === "Приглашён") {
      setIsModalInviteOpen(true);
      setInviteFormMessage(null);
      return;
    }

    if (nextStatus === "Отклонён" && actionConfirmSettings.confirmReject) {
      setPendingWarningAction({
        type: "reject",
        candidateId: modalCandidate.candidate.id,
        candidateName: modalCandidate.candidate.name,
      });
      return;
    }

    void handleMoveCandidate(modalCandidate.candidate.id, nextStatus);
  };

  const handleModalArchive = () => {
    if (!modalCandidate) return;

    if (actionConfirmSettings.confirmArchive) {
      setPendingWarningAction({
        type: "archive",
        candidateId: modalCandidate.candidate.id,
        candidateName: modalCandidate.candidate.name,
      });
      return;
    }

    void archiveCandidateFromModal();
  };

  const confirmPendingWarningAction = () => {
    if (!pendingWarningAction) return;

    if (pendingWarningAction.type === "archive") {
      void archiveCandidateFromModal();
      return;
    }

    void handleMoveCandidate(pendingWarningAction.candidateId, "Отклонён");
    setPendingWarningAction(null);
  };

  const handleModalInviteSubmit = async () => {
    if (!modalCandidate) return;

    if (!invitePosition.trim()) {
      setInviteFormMessage("Укажите должность для приглашения.");
      return;
    }

    if (!inviteComment.trim()) {
      setInviteFormMessage("Комментарий к приглашению обязателен.");
      return;
    }

    if (!inviteSendNow && !inviteScheduledAt) {
      setInviteFormMessage("Выберите дату отправки приглашения.");
      return;
    }

    const error = await Promise.resolve(
      onInviteCandidate(modalCandidate.candidate.id, {
        position: invitePosition.trim(),
        message: inviteComment.trim(),
        sendNow: inviteSendNow,
        scheduledAt: inviteSendNow ? undefined : inviteScheduledAt,
      }),
    );

    if (error) {
      setInviteFormMessage(error);
      return;
    }

    setMessage(`Приглашение для ${modalCandidate.candidate.name} отправлено.`);
    closeCandidateModal();
    syncDashboardData();
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[680px] flex-col gap-4 overflow-hidden">
      {message && (
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      )}

      <Tabs
        value={selectedTab}
        onValueChange={(next) => {
          const tab = next as HrDashboardTab;
          if (onTabChange) {
            onTabChange(tab);
            return;
          }
          setUncontrolledTab(tab);
        }}
        className="flex min-h-0 flex-1 flex-col gap-4">
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-foreground">Дашборды</h2>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Описание страницы"
                  className="inline-flex h-7 w-7 cursor-help items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground">
                  <CircleHelp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                В канбане отображаются только кандидаты, добавленные в воронку.
              </TooltipContent>
            </Tooltip>
          </div>

          <TabsList className="w-full lg:w-fit">
            <TabsTrigger value="kanban">Канбан</TabsTrigger>
            <TabsTrigger value="summary">Сводка</TabsTrigger>
            <TabsTrigger value="quick-search">Быстрый поиск</TabsTrigger>
            <TabsTrigger value="recent-actions">Последние действия</TabsTrigger>
            <TabsTrigger value="archive">Архив</TabsTrigger>
          </TabsList>
        </section>

        <TabsContent value="kanban" className="min-h-0 flex-1">
          <HrKanbanTab
            statusUpdateWindowDays={statusUpdateWindowDays}
            onStatusUpdateWindowDaysChange={setStatusUpdateWindowDays}
            visibleColumns={visibleColumns}
            columnStart={columnStart}
            maxColumnStart={maxColumnStart}
            onPrevColumn={() => setColumnStart((prev) => Math.max(0, prev - 1))}
            onNextColumn={() =>
              setColumnStart((prev) => Math.min(maxColumnStart, prev + 1))
            }
            funnelData={funnelData}
            isLoading={isLoading}
            onOpenCandidateModal={openCandidateModal}
            onOpenCandidateProfile={onOpenCandidate}
          />
        </TabsContent>

        <TabsContent value="summary" className="min-h-0 flex-1">
          <HrSummaryTab
            metrics={metrics}
            publishedEventsCount={publishedEventsCount}
            statusUpdateWindowDays={statusUpdateWindowDays}
            onStatusUpdateWindowDaysChange={setStatusUpdateWindowDays}
          />
        </TabsContent>

        <TabsContent value="quick-search" className="min-h-0 flex-1">
          <HrQuickSearchTab
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            quickSearchRows={quickSearchRows}
            paginatedQuickSearchRows={paginatedQuickSearchRows}
            safeQuickSearchPage={safeQuickSearchPage}
            quickSearchPageCount={quickSearchPageCount}
            onPrevPage={() =>
              setQuickSearchPage((prev) => Math.max(1, prev - 1))
            }
            onNextPage={() =>
              setQuickSearchPage((prev) =>
                Math.min(quickSearchPageCount, prev + 1),
              )
            }
            onOpenCandidate={onOpenCandidate}
          />
        </TabsContent>

        <TabsContent value="recent-actions" className="min-h-0 flex-1">
          <HrRecentActionsTab
            statusUpdateWindowDays={statusUpdateWindowDays}
            onStatusUpdateWindowDaysChange={setStatusUpdateWindowDays}
            recentActionsFilter={recentActionsFilter}
            onRecentActionsFilterChange={setRecentActionsFilter}
            recentActionsQuery={recentActionsQuery}
            onRecentActionsQueryChange={setRecentActionsQuery}
            filteredRecentActions={filteredRecentActions}
          />
        </TabsContent>

        <TabsContent value="archive" className="min-h-0 flex-1">
          <HrArchiveTab
            archiveCandidates={archiveCandidates}
            statusUpdateWindowDays={statusUpdateWindowDays}
            onStatusUpdateWindowDaysChange={setStatusUpdateWindowDays}
            onOpenCandidate={onOpenCandidate}
          />
        </TabsContent>
      </Tabs>

      <CandidateModal
        modalCandidate={modalCandidate}
        onClose={closeCandidateModal}
        onOpenCandidateProfile={onOpenCandidate}
        onTransition={handleModalTransition}
        onArchiveCandidate={handleModalArchive}
        isModalInviteOpen={isModalInviteOpen}
        invitePosition={invitePosition}
        onInvitePositionChange={setInvitePosition}
        inviteComment={inviteComment}
        onInviteCommentChange={setInviteComment}
        inviteSendNow={inviteSendNow}
        onInviteSendNowChange={setInviteSendNow}
        inviteScheduledAt={inviteScheduledAt}
        onInviteScheduledAtChange={setInviteScheduledAt}
        inviteFormMessage={inviteFormMessage}
        onInviteSubmit={handleModalInviteSubmit}
        onCloseInviteForm={() => setIsModalInviteOpen(false)}
        isModalNoteOpen={isModalNoteOpen}
        onToggleModalNote={() => setIsModalNoteOpen((prev) => !prev)}
        modalNoteDraft={modalNoteDraft}
        onModalNoteDraftChange={setModalNoteDraft}
        modalNoteMessage={modalNoteMessage}
        onSaveModalNote={handleSaveModalNote}
      />

      <AlertDialog
        open={pendingWarningAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingWarningAction(null);
          }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
              {pendingWarningAction?.type === "archive"
                ? "Переместить кандидата в архив?"
                : "Отклонить кандидата?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingWarningAction?.type === "archive"
                ? `Кандидат ${pendingWarningAction.candidateName} будет убран из воронки и перенесен в архив.`
                : `Кандидат ${pendingWarningAction?.candidateName} будет переведен в статус «Отклонён».`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={confirmPendingWarningAction}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
