"use client";

import { useEffect, useMemo, useState } from "react";
import { Achievement, AchievementTypeCode, AuthUser, Event } from "@/lib/types";
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
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
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
} from "@/components/shared/subscribers-preview-card";
import { AchievementDetailsModal } from "@/components/student/achievement-details-modal";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

type GrowthTrend = "up" | "down" | "stable";
type TimelinePeriod = 3 | 6 | 12;

const CANDIDATE_STATUS_STYLES: Record<HrFunnelStatus, string> = {
  "Не отслеживается": "bg-slate-100 text-slate-700 border-slate-200",
  "На рассмотрении": "bg-amber-100 text-amber-700 border-amber-200",
  Интересует: "bg-sky-100 text-sky-700 border-sky-200",
  Приглашён: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Ответили на приглашение": "bg-indigo-100 text-indigo-700 border-indigo-200",
  Отклонён: "bg-rose-100 text-rose-700 border-rose-200",
};

const TIMELINE_TYPE_OPTIONS: Array<{
  value: AchievementTypeCode;
  label: string;
}> = [
  { value: "OLYMPIAD", label: "Олимпиада" },
  { value: "CONFERENCE", label: "Конференция" },
  { value: "HACKATHON", label: "Хакатон" },
  { value: "PUBLICATION", label: "Публикация" },
  { value: "COURSE", label: "Курс" },
  { value: "VOLUNTEERING", label: "Волонтёрство" },
  { value: "GRANT", label: "Грант" },
  { value: "OTHER", label: "Другое" },
  { value: "CONTEST", label: "Конкурс" },
  { value: "CHAMPIONSHIP", label: "Чемпионат" },
];

function getAchievementStatusClasses(status: Achievement["status"]) {
  if (status === "Подтверждено") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "Отклонено") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-amber-100 text-amber-700 border-amber-200";
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toAchievementDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function countAchievementsInRange(
  items: Achievement[],
  start: Date,
  end: Date,
): number {
  return items.filter((item) => {
    const date = toAchievementDate(item.date);
    return !Number.isNaN(date.getTime()) && date >= start && date <= end;
  }).length;
}

function inferAchievementTypeCode(
  achievement: Achievement,
): AchievementTypeCode {
  if (achievement.achievementTypeCode) {
    return achievement.achievementTypeCode;
  }
  const normalizedType = (achievement.eventType || "").trim().toLowerCase();
  if (normalizedType === "олимпиада") return "OLYMPIAD";
  if (normalizedType === "конференция") return "CONFERENCE";
  if (normalizedType === "хакатон") return "HACKATHON";
  if (normalizedType === "конкурс") return "CONTEST";
  if (normalizedType === "чемпионат") return "CHAMPIONSHIP";
  return "OTHER";
}

function getTypeLabel(achievement: Achievement): string {
  const code = inferAchievementTypeCode(achievement);
  return (
    TIMELINE_TYPE_OPTIONS.find((option) => option.value === code)?.label ||
    achievement.eventType ||
    "Другое"
  );
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
  const [selectedTimelineYear, setSelectedTimelineYear] =
    useState<string>("all");
  const [selectedTimelineType, setSelectedTimelineType] = useState<
    AchievementTypeCode | "all"
  >("all");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [selectedTimelinePeriod, setSelectedTimelinePeriod] =
    useState<TimelinePeriod>(12);
  const [selectedAchievementId, setSelectedAchievementId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setNoteDraft(savedNote);
    setNoteMessage(null);
    setStatusMessage(null);
    setMessage(defaultInviteComment);
    setSelectedTimelineYear("all");
    setSelectedTimelineType("all");
    setOnlyVerified(false);
    setSelectedTimelinePeriod(12);
    setSelectedAchievementId(null);
  }, [savedNote, candidate?.id, defaultInviteComment]);

  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

  const allowedAchievementIds = useMemo(
    () => new Set(candidate?.publicProfile.visibleAchievementIds ?? []),
    [candidate?.publicProfile.visibleAchievementIds],
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

  const allAchievements = useMemo(
    () =>
      [...achievements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [achievements],
  );

  const timelineYears = useMemo(
    () =>
      Array.from(
        new Set(
          allAchievements.map((item) =>
            new Date(item.date).getFullYear().toString(),
          ),
        ),
      )
        .filter((year) => year !== "NaN")
        .sort((a, b) => Number(b) - Number(a)),
    [allAchievements],
  );

  const filteredTimelineAchievements = useMemo(
    () =>
      allAchievements.filter((achievement) => {
        if (onlyVerified && achievement.status !== "Подтверждено") {
          return false;
        }
        const year = new Date(achievement.date).getFullYear().toString();
        if (selectedTimelineYear !== "all" && year !== selectedTimelineYear) {
          return false;
        }
        const typeCode = inferAchievementTypeCode(achievement);
        if (
          selectedTimelineType !== "all" &&
          typeCode !== selectedTimelineType
        ) {
          return false;
        }
        return true;
      }),
    [allAchievements, onlyVerified, selectedTimelineType, selectedTimelineYear],
  );

  const groupedTimeline = useMemo(() => {
    const map = new Map<string, Achievement[]>();
    filteredTimelineAchievements.forEach((achievement) => {
      const year = new Date(achievement.date).getFullYear().toString();
      if (!map.has(year)) {
        map.set(year, []);
      }
      map.get(year)?.push(achievement);
    });

    return Array.from(map.entries())
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, items]) => ({
        year,
        achievements: items,
      }));
  }, [filteredTimelineAchievements]);

  const activityChartData = useMemo(() => {
    const now = new Date();
    const currentMonth = startOfMonth(now);
    const months: Array<{ key: string; label: string; count: number }> = [];

    for (let offset = selectedTimelinePeriod - 1; offset >= 0; offset -= 1) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - offset,
        1,
      );
      months.push({
        key: toMonthKey(date),
        label: new Intl.DateTimeFormat("ru-RU", {
          month: "short",
        }).format(date),
        count: 0,
      });
    }

    const counter = new Map(months.map((month) => [month.key, 0]));
    allAchievements.forEach((achievement) => {
      const date = toAchievementDate(achievement.date);
      if (Number.isNaN(date.getTime())) {
        return;
      }
      const key = toMonthKey(startOfMonth(date));
      if (counter.has(key)) {
        counter.set(key, (counter.get(key) ?? 0) + 1);
      }
    });

    return months.map((month) => ({
      month: month.label,
      monthKey: month.key,
      count: counter.get(month.key) ?? 0,
    }));
  }, [allAchievements, selectedTimelinePeriod]);

  const activitySummary = useMemo(() => {
    const totalAchievements = activityChartData.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const now = new Date();
    const currentPeriodStart = new Date(
      now.getFullYear(),
      now.getMonth() - 2,
      1,
    );
    const currentPeriodEnd = endOfMonth(now);
    const previousPeriodStart = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1,
    );
    const previousPeriodEnd = endOfMonth(
      new Date(now.getFullYear(), now.getMonth() - 3, 1),
    );
    const currentPeriod = countAchievementsInRange(
      allAchievements,
      currentPeriodStart,
      currentPeriodEnd,
    );
    const previousPeriod = countAchievementsInRange(
      allAchievements,
      previousPeriodStart,
      previousPeriodEnd,
    );

    let trend: GrowthTrend = "stable";
    if (currentPeriod > previousPeriod) trend = "up";
    if (currentPeriod < previousPeriod) trend = "down";

    const trendPercentage =
      previousPeriod === 0
        ? currentPeriod === 0
          ? 0
          : 100
        : Math.round(((currentPeriod - previousPeriod) / previousPeriod) * 100);

    return {
      totalAchievements,
      trend,
      trendPercentage,
      previousPeriodTotal: previousPeriod,
      currentPeriodTotal: currentPeriod,
      currentPeriodStart,
      currentPeriodEnd,
      previousPeriodStart,
      previousPeriodEnd,
    };
  }, [activityChartData, selectedTimelinePeriod]);

  const selectedTimelineAchievement = useMemo(
    () =>
      selectedAchievementId
        ? (allAchievements.find((item) => item.id === selectedAchievementId) ??
          null)
        : null,
    [allAchievements, selectedAchievementId],
  );

  const selectedTimelineEvent = selectedTimelineAchievement?.eventId
    ? eventById.get(selectedTimelineAchievement.eventId)
    : undefined;

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
      (candidate?.publicProfile.visibleBadgeIds ?? [])
        .map((badgeId) => visibleBadgeMap.get(badgeId) ?? null)
        .filter((badge): badge is NonNullable<typeof badge> => badge !== null),
    [candidate?.publicProfile.visibleBadgeIds, visibleBadgeMap],
  );

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
    <div className="flex flex-col gap-4">
      <section className="space-y-2.5">
        <button
          type="button"
          onClick={onBackToPreviousPage}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="max-w-2xl space-y-2">
            <div className="space-y-1">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${CANDIDATE_STATUS_STYLES[candidateStatus]}`}>
                {candidateStatus}
              </span>
              <h2 className="text-2xl font-bold leading-tight text-foreground">
                {candidate.name}
              </h2>
            </div>

            <div className="space-y-1.5 pt-0.5 text-sm text-muted-foreground">
              <p className="flex items-start gap-1.5">
                <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>{candidate.email}</span>
              </p>
              <p className="flex items-start gap-1.5">
                <School className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {candidate.publicProfile.university || "Вуз не указан"}
                </span>
              </p>
              <p className="flex items-start gap-1.5">
                <GraduationCap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {candidate.publicProfile.faculty || "Факультет не указан"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onToggleSubscription}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">
              {isCurrentHrSubscribed ? (
                <>
                  <BellOff className="h-3.5 w-3.5" />
                  Отписаться
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">
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
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
                <Send className="h-3.5 w-3.5" />
                Пригласить
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <div className="space-y-1.5 rounded-xl border border-border bg-card p-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <NotebookPen className="h-3.5 w-3.5 text-primary" />
              Заметка HR
            </div>
            <p className="max-h-20 overflow-hidden whitespace-pre-wrap text-sm text-muted-foreground">
              {notePreview}
            </p>
            <button
              type="button"
              onClick={() => {
                setNoteMessage(null);
                setIsNoteOpen(true);
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">
              <NotebookPen className="h-3.5 w-3.5" />
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

      <Tabs defaultValue="growth-history" className="gap-3">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="growth-history"
            className="h-8 rounded-md px-3 text-xs">
            История роста
          </TabsTrigger>
          <TabsTrigger
            value="achievements"
            className="h-8 rounded-md px-3 text-xs">
            Достижения
          </TabsTrigger>
          <TabsTrigger value="badges" className="h-8 rounded-md px-3 text-xs">
            Значки
          </TabsTrigger>
          <TabsTrigger
            value="status-history"
            className="h-8 rounded-md px-3 text-xs">
            История статусов
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth-history" className="space-y-3">
          <section className="rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                График активности
              </h3>
              <label className="relative inline-flex items-center">
                <select
                  value={selectedTimelinePeriod}
                  onChange={(event) =>
                    setSelectedTimelinePeriod(
                      Number(event.target.value) as TimelinePeriod,
                    )
                  }
                  className="appearance-none rounded-md border border-border bg-background px-2.5 py-1.5 pr-7 text-xs text-foreground">
                  <option value={3}>3 мес</option>
                  <option value={6}>6 мес</option>
                  <option value={12}>12 мес</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
              </label>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Динамика достижений по выбранному периоду
            </p>

            <div className="mt-3 h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    formatter={(value) => [`${value}`, "Достижений"]}
                    labelFormatter={(label) => `Месяц: ${label}`}
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid gap-2 rounded-lg border border-border bg-background p-3 text-sm">
              <p className="text-foreground">
                Всего достижений:{" "}
                <span className="font-semibold">
                  {activitySummary.totalAchievements}
                </span>
              </p>
              {activitySummary.trend === "up" && (
                <p className="inline-flex items-center gap-1 text-emerald-700">
                  <TrendingUp className="h-4 w-4" />
                  На {Math.abs(activitySummary.trendPercentage)}% больше, чем за
                  предыдущий период
                </p>
              )}
              {activitySummary.trend === "down" && (
                <p className="inline-flex items-center gap-1 text-rose-700">
                  <TrendingDown className="h-4 w-4" />
                  На {Math.abs(activitySummary.trendPercentage)}% меньше, чем за
                  предыдущий период
                </p>
              )}
              {activitySummary.trend === "stable" && (
                <p className="inline-flex items-center gap-1 text-slate-600">
                  <Minus className="h-4 w-4" />
                  Без изменений
                </p>
              )}
              <div className="group relative inline-flex w-fit">
                <span className="cursor-help text-xs text-muted-foreground underline decoration-dotted underline-offset-2">
                  Детали тренда
                </span>
                <div className="pointer-events-none absolute left-0 top-full z-10 mt-2 w-100 rounded-md border border-border bg-background px-2.5 py-2 text-xs text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  <div className="space-y-1">
                    <p className="text-foreground">
                      Тренд = {activitySummary.currentPeriodTotal || 0} -{" "}
                      {activitySummary.previousPeriodTotal || 0}
                    </p>
                    <p>Процент = ((текущий - предыдущий) / предыдущий) * 100</p>
                    <p>
                      Текущий период:{" "}
                      {formatLongDate(activitySummary.currentPeriodStart)} -{" "}
                      {formatLongDate(activitySummary.currentPeriodEnd)}
                    </p>
                    <p>
                      Предыдущий период:{" "}
                      {formatLongDate(activitySummary.previousPeriodStart)} -{" "}
                      {formatLongDate(activitySummary.previousPeriodEnd)}
                    </p>
                    <p>
                      Текущий: {activitySummary.currentPeriodTotal}, предыдущий:{" "}
                      {activitySummary.previousPeriodTotal}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2 rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  История роста
                </h3>
                <p className="text-xs text-muted-foreground">
                  Хронология достижений с группировкой по годам
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <select
                  value={selectedTimelineYear}
                  onChange={(event) =>
                    setSelectedTimelineYear(event.target.value)
                  }
                  className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground">
                  <option value="all">Все годы</option>
                  {timelineYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedTimelineType}
                  onChange={(event) =>
                    setSelectedTimelineType(
                      event.target.value as AchievementTypeCode | "all",
                    )
                  }
                  className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground">
                  <option value="all">Все типы</option>
                  {TIMELINE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground">
                  <input
                    type="checkbox"
                    checked={onlyVerified}
                    onChange={(event) => setOnlyVerified(event.target.checked)}
                  />
                  Только подтвержденные
                </label>
              </div>
            </div>

            {groupedTimeline.length > 0 ? (
              <div className="space-y-3">
                {groupedTimeline.map((group) => (
                  <div key={group.year} className="space-y-2">
                    <div className="sticky top-0 z-[1] inline-flex rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground">
                      {group.year}
                    </div>
                    <div className="relative space-y-2 pl-4">
                      <span className="absolute left-1 top-1 bottom-1 w-px bg-border" />
                      {group.achievements.map((achievement) => (
                        <article
                          key={achievement.id}
                          className="relative rounded-lg border border-border bg-background p-2.5">
                          <span className="absolute -left-[17px] top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                          <div className="flex flex-wrap items-start justify-between gap-1.5">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {new Date(achievement.date).toLocaleDateString(
                                  "ru-RU",
                                )}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedAchievementId(achievement.id)
                                }
                                className="cursor-pointer text-left text-sm font-semibold text-foreground hover:text-primary hover:underline">
                                {achievement.title}
                              </button>
                              <p className="text-xs text-muted-foreground">
                                Тип:{" "}
                                <span className="text-foreground">
                                  {getTypeLabel(achievement)}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Уровень:{" "}
                                <span className="text-foreground">
                                  {achievement.level}
                                </span>
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getAchievementStatusClasses(achievement.status)}`}>
                              {achievement.status === "Подтверждено" ? (
                                <CircleCheck className="h-3 w-3" />
                              ) : achievement.status === "Отклонено" ? (
                                <CircleX className="h-3 w-3" />
                              ) : (
                                <Clock3 className="h-3 w-3" />
                              )}
                              {achievement.status}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                Нет достижений для выбранных фильтров
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="achievements">
          {visibleAchievements.length > 0 ? (
            <div className="space-y-2">
              {visibleAchievements.map((achievement) => {
                const relatedEvent = achievement.eventId
                  ? eventById.get(achievement.eventId)
                  : undefined;

                return (
                  <div
                    key={achievement.id}
                    className="space-y-1.5 rounded-lg border border-border bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {achievement.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(achievement.date).toLocaleDateString(
                            "ru-RU",
                          )}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getAchievementStatusClasses(achievement.status)}`}>
                        {achievement.status === "Подтверждено" ? (
                          <CircleCheck className="h-3 w-3" />
                        ) : achievement.status === "Отклонено" ? (
                          <CircleX className="h-3 w-3" />
                        ) : (
                          <Clock3 className="h-3 w-3" />
                        )}
                        {achievement.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Уровень:{" "}
                      <span className="text-foreground">
                        {achievement.level}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Результат:{" "}
                      <span className="text-foreground">
                        {achievement.result}
                      </span>
                    </p>

                    {relatedEvent ? (
                      <div className="pt-0.5">
                        <p className="text-xs text-muted-foreground">
                          Мероприятие:{" "}
                          <span className="text-foreground">
                            {relatedEvent.title}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() => onOpenEvent(relatedEvent.id)}
                          className="mt-0.5 cursor-pointer text-xs text-primary hover:underline">
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
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {visibleBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-card p-3 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                    {badge.icon}
                  </div>
                  <p className="text-sm font-semibold leading-snug text-foreground">
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
            <div className="space-y-2">
              {statusHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border bg-card p-2.5">
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

      <AchievementDetailsModal
        achievement={selectedTimelineAchievement}
        event={selectedTimelineEvent}
        onClose={() => setSelectedAchievementId(null)}
        onOpenEvent={onOpenEvent}
      />
    </div>
  );
}
