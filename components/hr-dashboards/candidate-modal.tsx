import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ALLOWED_TRANSITIONS } from "@/components/hr-dashboards/constants";
import {
  FunnelCandidate,
  KanbanStatus,
} from "@/components/hr-dashboards/types";

const STATUS_STYLES: Record<KanbanStatus, string> = {
  "На рассмотрении": "bg-amber-100 text-amber-700 border-amber-200",
  Интересует: "bg-sky-100 text-sky-700 border-sky-200",
  Приглашён: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Ответили на приглашение": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Отклонён: "bg-rose-100 text-rose-700 border-rose-200",
};

interface CandidateModalProps {
  modalCandidate: { candidate: FunnelCandidate; status: KanbanStatus } | null;
  onClose: () => void;
  onOpenCandidateProfile: (candidateId: string) => void;
  onTransition: (nextStatus: KanbanStatus) => void;
  onArchiveCandidate: () => void;

  isModalInviteOpen: boolean;
  invitePosition: string;
  onInvitePositionChange: (value: string) => void;
  inviteComment: string;
  onInviteCommentChange: (value: string) => void;
  inviteSendNow: boolean;
  onInviteSendNowChange: (value: boolean) => void;
  inviteScheduledAt: string;
  onInviteScheduledAtChange: (value: string) => void;
  inviteFormMessage: string | null;
  onInviteSubmit: () => void;
  onCloseInviteForm: () => void;

  isModalNoteOpen: boolean;
  onToggleModalNote: () => void;
  modalNoteDraft: string;
  onModalNoteDraftChange: (value: string) => void;
  modalNoteMessage: string | null;
  onSaveModalNote: () => void;
}

export function CandidateModal({
  modalCandidate,
  onClose,
  onOpenCandidateProfile,
  onTransition,
  onArchiveCandidate,
  isModalInviteOpen,
  invitePosition,
  onInvitePositionChange,
  inviteComment,
  onInviteCommentChange,
  inviteSendNow,
  onInviteSendNowChange,
  inviteScheduledAt,
  onInviteScheduledAtChange,
  inviteFormMessage,
  onInviteSubmit,
  onCloseInviteForm,
  isModalNoteOpen,
  onToggleModalNote,
  modalNoteDraft,
  onModalNoteDraftChange,
  modalNoteMessage,
  onSaveModalNote,
}: CandidateModalProps) {
  const isModalNoteDirty = Boolean(
    modalCandidate &&
    modalNoteDraft.trim() !== modalCandidate.candidate.note.trim(),
  );

  return (
    <Dialog
      open={modalCandidate !== null}
      onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden">
        {modalCandidate && (
          <div className="flex h-full max-h-[80vh] flex-col gap-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Карточка кандидата
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[modalCandidate.status]}`}>
                  {modalCandidate.status}
                </span>
              </DialogTitle>
              <DialogDescription>
                Детали кандидата и действия по перемещению между колонками.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-auto pr-1">
              <div className="space-y-4">
                <div className="rounded-xl border border-border p-4">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenCandidateProfile(modalCandidate.candidate.id)
                    }
                    className="inline-flex cursor-pointer items-center gap-2 text-left text-xl font-semibold text-foreground hover:text-primary">
                    {modalCandidate.candidate.name}
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {modalCandidate.candidate.university},{" "}
                    {modalCandidate.candidate.faculty},{" "}
                    {modalCandidate.candidate.course}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Достижения: {modalCandidate.candidate.totalAchievements} /
                    подтверждено{" "}
                    {modalCandidate.candidate.confirmedAchievements}
                  </p>
                </div>

                <div className="rounded-xl border border-border p-4">
                  <h4 className="text-sm font-semibold text-foreground">
                    Перемещение по воронке
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ALLOWED_TRANSITIONS[modalCandidate.status].map(
                      (nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          onClick={() => onTransition(nextStatus)}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-85 ${STATUS_STYLES[nextStatus]}`}>
                          <ArrowRight className="mr-1.5 w-4 h-4" />
                          {nextStatus}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={onArchiveCandidate}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-opacity hover:opacity-85">
                      <ArrowRight className="mr-1.5 w-4 h-4" />В архив
                    </button>
                  </div>
                </div>

                {isModalInviteOpen && (
                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      Приглашение кандидата
                    </h4>

                    <Input
                      value={invitePosition}
                      onChange={(event) =>
                        onInvitePositionChange(event.target.value)
                      }
                      placeholder="Например: Junior Frontend Developer"
                    />

                    <Textarea
                      value={inviteComment}
                      onChange={(event) =>
                        onInviteCommentChange(event.target.value)
                      }
                      rows={4}
                      placeholder="Комментарий к приглашению"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={inviteSendNow ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => onInviteSendNowChange(true)}>
                        Отправить сейчас
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!inviteSendNow ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => onInviteSendNowChange(false)}>
                        Запланировать
                      </Button>
                    </div>

                    {!inviteSendNow && (
                      <Input
                        type="date"
                        value={inviteScheduledAt}
                        onChange={(event) =>
                          onInviteScheduledAtChange(event.target.value)
                        }
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="cursor-pointer"
                        onClick={onInviteSubmit}>
                        Отправить приглашение
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="cursor-pointer"
                        onClick={onCloseInviteForm}>
                        Отмена
                      </Button>
                    </div>

                    {inviteFormMessage && (
                      <p className="text-sm text-muted-foreground">
                        {inviteFormMessage}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      Заметка
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="cursor-pointer"
                      onClick={onToggleModalNote}>
                      {isModalNoteOpen ? "Свернуть" : "Развернуть"}
                    </Button>
                  </div>

                  {isModalNoteOpen ? (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={modalNoteDraft}
                        onChange={(event) =>
                          onModalNoteDraftChange(event.target.value)
                        }
                        rows={5}
                        placeholder="Добавьте заметку по кандидату"
                      />
                      {isModalNoteDirty && (
                        <Button
                          type="button"
                          size="sm"
                          className="cursor-pointer"
                          onClick={onSaveModalNote}>
                          Сохранить заметку
                        </Button>
                      )}
                      {modalNoteMessage && (
                        <p className="text-sm text-emerald-600">
                          {modalNoteMessage}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {modalCandidate.candidate.note.trim()
                        ? "Заметка свернута"
                        : "Заметки пока нет"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
