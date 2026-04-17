"use client";

import { useEffect, useMemo, useState } from "react";
import { Achievement, AuthUser, Event } from "@/lib/types";
import { buildBadgeViewModels } from "@/lib/badges";
import { HrFunnelStatus, HrStatusHistoryEntry } from "@/lib/hr-funnel";
import {
  ArrowLeft,
  Mail,
  GraduationCap,
  School,
  Send,
  Clock3,
  NotebookPen,
  Bell,
  BellOff,
  CircleCheck,
  CircleX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SubscriberPreviewItem,
  SubscribersPreviewCard,
} from "@/components/subscribers-preview-card";

export interface HrInvitationPayload {
  position: string;
  message: string;
  sendNow: boolean;
  scheduledAt?: string;
}

interface HrCandidateProfilePageProps {
  candidate: AuthUser | null;
  achievements: Achievement[];
  events: Event[];
  candidateStatus: HrFunnelStatus;
  statusHistory: HrStatusHistoryEntry[];
  savedNote: string;
  defaultInviteComment: string;
  subscribers: SubscriberPreviewItem[];
  isCurrentHrSubscribed: boolean;
  onBackToPreviousPage: () => void;
  onOpenEvent: (eventId: string) => void;
  onSaveNote: (note: string) => void;
  onInvite: (payload: HrInvitationPayload) => string | null;
  onToggleSubscription: () => void;
  onOpenSubscribers: () => void;
  onAddToFunnel: () => string | null;
}

const CANDIDATE_STATUS_STYLES: Record<HrFunnelStatus, string> = {
  "Не отслеживается": "bg-slate-100 text-slate-700 border-slate-200",
  "На рассмотрении": "bg-amber-100 text-amber-700 border-amber-200",
  Интересует: "bg-sky-100 text-sky-700 border-sky-200",
  Приглашён: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Ответили на приглашение": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Отклонён: "bg-rose-100 text-rose-700 border-rose-200",
};

function getAchievementStatusClasses(status: Achievement["status"]) {
  if (status === "Подтверждено") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "Отклонено") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-amber-100 text-amber-700 border-amber-200";
}

export function HrCandidateProfilePage({
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
}: HrCandidateProfilePageProps) {
  const [noteDraft, setNoteDraft] = useState(savedNote);
  const [noteMessage, setNoteMessage] = useState<string | null>(null);
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [position, setPosition] = useState("");
  const [message, setMessage] = useState(defaultInviteComment);
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState("");
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setNoteDraft(savedNote);
    setNoteMessage(null);
    setStatusMessage(null);
    setMessage(defaultInviteComment);
  }, [savedNote, candidate?.id, defaultInviteComment]);

  if (!candidate) {
    return (
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          Профиль кандидата
        </h2>
        <div className="bg-card border border-border rounded-xl py-12 text-center text-muted-foreground">
          Кандидат не выбран. Перейдите в поиск кандидатов и откройте профиль.
        </div>
      </div>
    );
  }

  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

  const allowedAchievementIds = new Set(
    candidate.publicProfile.visibleAchievementIds,
  );

  const visibleAchievements = useMemo(
    () =>
      achievements
        .filter((item) => allowedAchievementIds.has(item.id))
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [achievements, allowedAchievementIds],
  );

  const unlockedBadges = useMemo(
    () => buildBadgeViewModels(achievements).filter((badge) => badge.unlocked),
    [achievements],
  );

  const visibleBadgeMap = useMemo(
    () => new Map(unlockedBadges.map((badge) => [badge.id, badge])),
    [unlockedBadges],
  );

  const visibleBadges = useMemo(
    () =>
      candidate.publicProfile.visibleBadgeIds
        .map((badgeId) => visibleBadgeMap.get(badgeId) ?? null)
        .filter((badge): badge is NonNullable<typeof badge> => badge !== null),
    [candidate.publicProfile.visibleBadgeIds, visibleBadgeMap],
  );
  const canAddToFunnel = candidateStatus === "Не отслеживается";
  const canInvite =
    candidateStatus === "На рассмотрении" || candidateStatus === "Интересует";

  const notePreview = savedNote.trim()
    ? savedNote
    : "Заметка пока не добавлена";

  const handleNoteSave = () => {
    onSaveNote(noteDraft);
    setNoteMessage("Заметка сохранена");
    setIsNoteOpen(false);
  };

  const handleInviteSubmit = () => {
    if (!position.trim()) {
      setInviteMessage("Укажите должность для приглашения.");
      return;
    }

    if (!message.trim()) {
      setInviteMessage("Комментарий к приглашению обязателен.");
      return;
    }

    if (!sendNow && !scheduledAt) {
      setInviteMessage("Выберите дату отправки приглашения.");
      return;
    }

    const result = onInvite({
      position: position.trim(),
      message: message.trim(),
      sendNow,
      scheduledAt: sendNow ? undefined : scheduledAt,
    });

    setInviteMessage(result ?? "Приглашение отправлено");

    if (!result) {
      setIsInviteOpen(false);
      setPosition("");
      setMessage(defaultInviteComment);
      setSendNow(true);
      setScheduledAt("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <button
          type="button"
          onClick={onBackToPreviousPage}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3 max-w-2xl">
            <div className="space-y-1.5">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${CANDIDATE_STATUS_STYLES[candidateStatus]}`}>
                {candidateStatus}
              </span>
              <h2 className="text-3xl font-bold text-foreground">
                {candidate.name}
              </h2>
            </div>

            <div className="pt-1 space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{candidate.email}</span>
              </p>
              <p className="flex items-start gap-2">
                <School className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {candidate.publicProfile.university || "Вуз не указан"}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {candidate.publicProfile.faculty || "Факультет не указан"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSubscription}
              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm">
              {isCurrentHrSubscribed ? (
                <>
                  <BellOff className="w-4 h-4" />
                  Отписаться
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Подписаться
                </>
              )}
            </button>
            {canAddToFunnel && (
              <button
                type="button"
                onClick={() => {
                  const result = onAddToFunnel();
                  setStatusMessage(
                    result ?? "Кандидат добавлен в колонку «На рассмотрении».",
                  );
                }}
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm">
                Добавить в воронку
              </button>
            )}
            {canInvite && (
              <button
                type="button"
                onClick={() => {
                  setInviteMessage(null);
                  setPosition("");
                  setMessage(defaultInviteComment);
                  setSendNow(true);
                  setScheduledAt("");
                  setIsInviteOpen(true);
                }}
                className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                <Send className="w-4 h-4" />
                Пригласить
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <NotebookPen className="w-4 h-4 text-primary" />
              Заметка HR
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {notePreview}
            </p>
            <button
              type="button"
              onClick={() => {
                setNoteMessage(null);
                setIsNoteOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm">
              <NotebookPen className="w-4 h-4" />
              Редактировать заметку
            </button>
          </div>

          <SubscribersPreviewCard
            title="Подписчики кандидата"
            description="Кто следит за обновлениями профиля"
            subscribers={subscribers}
            onOpen={onOpenSubscribers}
          />
        </div>

        {inviteMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {inviteMessage}
          </div>
        )}

        {statusMessage && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            {statusMessage}
          </div>
        )}
      </section>

      <Tabs defaultValue="achievements" className="gap-4">
        <TabsList>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="badges">Значки</TabsTrigger>
          <TabsTrigger value="status-history">История статусов</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements">
          {visibleAchievements.length > 0 ? (
            <div className="space-y-3">
              {visibleAchievements.map((achievement) => {
                const relatedEvent = achievement.eventId
                  ? eventById.get(achievement.eventId)
                  : undefined;

                return (
                  <div
                    key={achievement.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(achievement.date).toLocaleDateString(
                            "ru-RU",
                          )}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getAchievementStatusClasses(achievement.status)}`}>
                        {achievement.status === "Подтверждено" ? (
                          <CircleCheck className="w-3.5 h-3.5" />
                        ) : achievement.status === "Отклонено" ? (
                          <CircleX className="w-3.5 h-3.5" />
                        ) : (
                          <Clock3 className="w-3.5 h-3.5" />
                        )}
                        {achievement.status}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Уровень:{" "}
                      <span className="text-foreground">
                        {achievement.level}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Результат:{" "}
                      <span className="text-foreground">
                        {achievement.result}
                      </span>
                    </p>

                    {relatedEvent ? (
                      <div className="pt-1">
                        <p className="text-sm text-muted-foreground">
                          Мероприятие:{" "}
                          <span className="text-foreground">
                            {relatedEvent.title}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenEvent(relatedEvent.id)}
                          className="mt-1 cursor-pointer text-sm text-primary hover:underline">
                          Открыть мероприятие
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-border py-8 text-center text-muted-foreground text-sm">
              Кандидат пока не открыл достижения для просмотра
            </div>
          )}
        </TabsContent>

        <TabsContent value="badges">
          {visibleBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="rounded-xl border border-primary/30 bg-card p-5 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-bold">
                    {badge.icon}
                  </div>
                  <p className="font-semibold text-foreground leading-snug">
                    {badge.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {badge.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground">
              Кандидат пока не открыл значки для просмотра
            </div>
          )}
        </TabsContent>

        <TabsContent value="status-history">
          {statusHistory.length > 0 ? (
            <div className="space-y-3">
              {statusHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border p-3 bg-card">
                  <p className="text-sm font-medium text-foreground">
                    {entry.fromStatus} → {entry.toStatus}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(entry.changedAt).toLocaleString("ru-RU")}
                    {entry.actorName ? ` · ${entry.actorName}` : ""}
                  </p>
                  {entry.note && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {entry.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border py-8 text-center text-muted-foreground text-sm">
              История изменений статусов пока отсутствует
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заметка HR</DialogTitle>
            <DialogDescription>
              Сохраните внутренний комментарий по кандидату.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              rows={6}
              placeholder="Добавьте заметку о кандидате"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {noteMessage && (
              <p className="text-sm text-emerald-600">{noteMessage}</p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsNoteOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary cursor-pointer">
              Отмена
            </button>
            <button
              type="button"
              onClick={handleNoteSave}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 cursor-pointer">
              Сохранить
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отправить приглашение</DialogTitle>
            <DialogDescription>
              Заполните параметры приглашения кандидату.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Должность
              </span>
              <input
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                type="text"
                placeholder="Например: Junior Frontend Developer"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Сообщение
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="Добавьте текст приглашения"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={sendNow}
                onChange={(event) => setSendNow(event.target.checked)}
              />
              Отправить сейчас
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-foreground">
                Дата отправки
              </span>
              <input
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                type="date"
                disabled={sendNow}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>

            {inviteMessage && (
              <p className="text-sm text-rose-600">{inviteMessage}</p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary cursor-pointer">
              Отмена
            </button>
            <button
              type="button"
              onClick={handleInviteSubmit}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 cursor-pointer">
              Пригласить
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
