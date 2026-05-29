"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppNotification } from "@/lib/types";
import { HrFunnelStatus } from "@/lib/hr-funnel";
import type {
  HrFeedNewsItem,
  HrFeedRecommendationsItem,
  HrRecommendationsFilter,
} from "@/lib/backend-api";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  GraduationCap,
  Layers2,
  PlusCircle,
  UserPlus,
  UserRoundCheck,
  Star,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import type { HrHomeTab } from "@/app/shared/routing/app-shell-routes";

export interface HrHomeTopAchievementCandidate {
  id: string;
  name: string;
  email: string;
  university: string;
  totalAchievementsCount: number;
  confirmedAchievementsCount: number;
  candidateStatus: HrFunnelStatus;
}

export interface HrHomeTopSubscriberCandidate {
  id: string;
  name: string;
  email: string;
  university: string;
  subscriberCount: number;
  totalAchievementsCount: number;
  candidateStatus: HrFunnelStatus;
}

export interface HrTalentFeedComparison {
  text: string;
  tone: "up" | "down" | "stable" | "empty";
}

interface HrHomePageProps {
  topByAchievements: HrHomeTopAchievementCandidate[];
  topBySubscribers: HrHomeTopSubscriberCandidate[];
  notifications: AppNotification[];
  talentFeedComparison?: HrTalentFeedComparison | null;
  activeTab: HrHomeTab;
  onTabChange: (tab: HrHomeTab) => void;
  newsFeedItems: HrFeedNewsItem[];
  newsFeedEmptyMessage?: string | null;
  newsFeedError?: string | null;
  newsFeedHasMore: boolean;
  isNewsFeedLoadingInitial: boolean;
  isNewsFeedLoadingMore: boolean;
  onLoadMoreNewsFeed: () => void;
  onMarkNewsViewed: (newsIds: string[]) => void;
  onAddNewsCandidateToFunnel: (candidateId: string) => string | null | Promise<string | null>;
  recommendationsItems: HrFeedRecommendationsItem[];
  recommendationsEmptyMessage?: string | null;
  recommendationsError?: string | null;
  recommendationsHasMore: boolean;
  isRecommendationsLoadingInitial: boolean;
  isRecommendationsLoadingMore: boolean;
  recommendationsFilter: HrRecommendationsFilter;
  onRecommendationsFilterChange: (filter: HrRecommendationsFilter) => void;
  onLoadMoreRecommendations: () => void;
  onMarkRecommendationsViewed: (candidateIds: string[]) => void;
  onToggleRecommendationSubscription: (
    candidateId: string,
  ) => string | null | Promise<string | null>;
  onAddRecommendationCandidateToFunnel: (
    candidateId: string,
  ) => string | null | Promise<string | null>;
  onOpenCandidate: (candidateId: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
}

const HR_HOME_COPY: Record<HrHomeTab, { title: string; description: string }> = {
  news: {
    title: "Новости отслеживаемых студентов",
    description:
      "Свежие подтвержденные достижения кандидатов, на которых вы подписаны.",
  },
  recommendations: {
    title: "Рекомендации кандидатов",
    description:
      "Новые релевантные студенты для расширения воронки подбора.",
  },
  summary: {
    title: "Ключевая сводка по кандидатам",
    description: "Быстрый доступ к сильнейшим кандидатам и свежим уведомлениям.",
  },
};

function getCandidateStatusClasses(status: HrFunnelStatus): string {
  if (status === "Не отслеживается") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  if (status === "На рассмотрении") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  if (status === "Интересует") {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }
  if (status === "Приглашён") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  if (status === "Ответили на приглашение") {
    return "border-indigo-200 bg-indigo-100 text-indigo-700";
  }
  return "border-rose-200 bg-rose-100 text-rose-700";
}

function getRankClasses(rank: number): string {
  if (rank === 0) return "bg-amber-100 text-amber-700 border-amber-200";
  if (rank === 1) return "bg-slate-100 text-slate-700 border-slate-200";
  return "bg-orange-100 text-orange-700 border-orange-200";
}

function formatDate(value: string): string {
  if (!value) return "Дата не указана";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ru-RU");
}

function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
}

function getDynamicsClasses(color: string): string {
  const normalized = color.toLowerCase();
  if (normalized.includes("green")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("red")) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (normalized.includes("yellow") || normalized.includes("amber")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function HrNewsFeedCard({
  item,
  onOpenCandidate,
  onAddToFunnel,
}: {
  item: HrFeedNewsItem;
  onOpenCandidate: (candidateId: string) => void;
  onAddToFunnel: (candidateId: string) => string | null | Promise<string | null>;
}) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToFunnel = async () => {
    setIsAdding(true);
    const result = await Promise.resolve(onAddToFunnel(item.student.id));
    if (result) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result,
      });
    } else {
      toast({
        title: "Готово",
        description: "Кандидат добавлен в колонку «На рассмотрении».",
      });
    }
    setIsAdding(false);
  };

  return (
    <article
      data-news-id={item.newsId}
      className="rounded-2xl border border-border bg-background p-4 shadow-sm transition-colors hover:border-blue-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 font-medium text-blue-700">
              <Trophy className="h-3.5 w-3.5" /> Новое достижение
            </span>
            {item.createdAt && <span>{formatDateTime(item.createdAt)}</span>}
          </div>

          <button
            type="button"
            onClick={() => onOpenCandidate(item.student.id)}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-left text-lg font-semibold text-foreground hover:text-primary">
            {item.student.fullName}
            <ArrowUpRight className="h-4 w-4" />
          </button>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{item.student.email || "Email не указан"}</span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {item.student.university || "Вуз не указан"}
              {item.student.faculty ? `, ${item.student.faculty}` : ""}
              {item.student.course ? `, ${item.student.course} курс` : ""}
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-secondary/70 bg-secondary/30 p-3">
            <h3 className="text-base font-semibold text-foreground">
              {item.achievement.title || "Достижение без названия"}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {(item.achievement.levelLabel || item.achievement.level) && (
                <span className="rounded-full border border-border bg-background px-2 py-1 text-muted-foreground">
                  {item.achievement.levelLabel || item.achievement.level}
                </span>
              )}
              {(item.achievement.resultLabel || item.achievement.result) && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-medium text-amber-700">
                  {item.achievement.resultLabel || item.achievement.result}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(item.achievement.date)}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.achievement.eventTitle || "Мероприятие не указано"}
              {item.achievement.organizerName
                ? ` · ${item.achievement.organizerName}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-64 lg:self-stretch">
          {item.activityDynamics.label && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${getDynamicsClasses(
                item.activityDynamics.color,
              )}`}>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                {item.activityDynamics.label}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              Сейчас
              <p className="text-lg font-bold text-foreground">
                {item.activityDynamics.currentPeriodCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              Ранее
              <p className="text-lg font-bold text-foreground">
                {item.activityDynamics.previousPeriodCount}
              </p>
            </div>
          </div>

          {item.actions.canAddToFunnel && (
            <Button
              type="button"
              size="sm"
              onClick={handleAddToFunnel}
              disabled={isAdding}
              className="w-full">
              {isAdding ? (
                <Spinner className="mr-1.5 size-4" />
              ) : (
                <PlusCircle className="mr-1.5 h-4 w-4" />
              )}
              В воронку
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function HrRecommendationFeedCard({
  item,
  onOpenCandidate,
  onAddToFunnel,
  onToggleSubscription,
}: {
  item: HrFeedRecommendationsItem;
  onOpenCandidate: (candidateId: string) => void;
  onAddToFunnel: (candidateId: string) => string | null | Promise<string | null>;
  onToggleSubscription: (
    candidateId: string,
  ) => string | null | Promise<string | null>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingSubscription, setIsTogglingSubscription] = useState(false);

  const handleAddToFunnel = async () => {
    setIsAdding(true);
    const result = await Promise.resolve(onAddToFunnel(item.student.id));
    if (result) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result,
      });
    } else {
      toast({
        title: "Готово",
        description: "Кандидат добавлен в колонку «На рассмотрении».",
      });
    }
    setIsAdding(false);
  };

  const handleToggleSubscription = async () => {
    setIsTogglingSubscription(true);
    const result = await Promise.resolve(onToggleSubscription(item.student.id));
    if (result) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: result,
      });
    } else {
      toast({
        title: "Готово",
        description: item.isSubscribed
          ? "Вы отписались от кандидата."
          : "Вы подписались на кандидата.",
      });
    }
    setIsTogglingSubscription(false);
  };

  const showAddToFunnel = !item.isInFunnel && item.actions.canAddToFunnel;
  const showSubscriptionButton = item.actions.canSubscribe || item.isSubscribed;

  return (
    <article
      data-recommendation-id={item.recommendationId}
      data-candidate-id={item.student.id}
      className="rounded-2xl border border-border bg-background p-4 shadow-sm transition-colors hover:border-cyan-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 font-medium text-cyan-700">
              <UserRoundCheck className="h-3.5 w-3.5" /> Рекомендация
            </span>
            <span
              className={`inline-flex rounded-full border px-2 py-1 font-medium ${getCandidateStatusClasses(
                item.currentHrStatus,
              )}`}>
              {item.currentHrStatus}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpenCandidate(item.student.id)}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-left text-lg font-semibold text-foreground hover:text-primary">
            {item.student.fullName}
            <ArrowUpRight className="h-4 w-4" />
          </button>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{item.student.email || "Email не указан"}</span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {item.student.university || "Вуз не указан"}
              {item.student.faculty ? `, ${item.student.faculty}` : ""}
              {item.student.course ? `, ${item.student.course} курс` : ""}
            </span>
          </div>

          {item.topAchievement ? (
            <div className="mt-4 rounded-xl border border-secondary/70 bg-secondary/30 p-3">
              <h3 className="text-base font-semibold text-foreground">
                {item.topAchievement.title || "Топ-достижение без названия"}
              </h3>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {(item.topAchievement.levelLabel || item.topAchievement.level) && (
                  <span className="rounded-full border border-border bg-background px-2 py-1 text-muted-foreground">
                    {item.topAchievement.levelLabel || item.topAchievement.level}
                  </span>
                )}
                {(item.topAchievement.resultLabel || item.topAchievement.result) && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 font-medium text-amber-700">
                    {item.topAchievement.resultLabel || item.topAchievement.result}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(item.topAchievement.date)}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.topAchievement.eventTitle || "Мероприятие не указано"}
                {item.topAchievement.organizerName
                  ? ` · ${item.topAchievement.organizerName}`
                  : ""}
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-secondary/20 p-3 text-sm text-muted-foreground">
              Нет данных по топ-достижению.
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-72">
          {item.activityDynamics.label && (
            <div
              className={`rounded-xl border px-3 py-2 text-sm font-medium ${getDynamicsClasses(
                item.activityDynamics.color,
              )}`}>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                {item.activityDynamics.label}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              Подписч.
              <p className="text-lg font-bold text-foreground">
                {item.subscriptionsCount}
              </p>
            </div>
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
              <p className="text-indigo-700">Ценность</p>
              <p className="inline-flex items-baseline gap-1 text-lg font-bold text-indigo-900">
                <Layers2 className="h-4 w-4" />
                {item.value}
                <span className="text-xs font-medium text-indigo-700">/100</span>
              </p>
              <div className="mt-1 h-1.5 rounded-full bg-indigo-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, item.value))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {showAddToFunnel ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddToFunnel}
                  disabled={isAdding}
                  className="w-full">
                  {isAdding ? (
                    <Spinner className="mr-1.5 size-4" />
                  ) : (
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                  )}
                  В воронку
                </Button>
              ) : (
                <div />
              )}

              {showSubscriptionButton ? (
                <Button
                  type="button"
                  size="sm"
                  variant={item.isSubscribed ? "outline" : "default"}
                  onClick={handleToggleSubscription}
                  disabled={isTogglingSubscription}
                  className="w-full">
                  {isTogglingSubscription ? (
                    <Spinner className="mr-1.5 size-4" />
                  ) : (
                    <UserPlus className="mr-1.5 h-4 w-4" />
                  )}
                  {item.isSubscribed ? "Отписаться" : "Подписаться"}
                </Button>
              ) : (
                <div />
              )}
            </div>

          </div>
        </div>
      </div>
    </article>
  );
}

export function HrHomePage({
  topByAchievements,
  topBySubscribers,
  notifications,
  talentFeedComparison: _talentFeedComparison,
  activeTab,
  onTabChange,
  newsFeedItems,
  newsFeedEmptyMessage,
  newsFeedError,
  newsFeedHasMore,
  isNewsFeedLoadingInitial,
  isNewsFeedLoadingMore,
  onLoadMoreNewsFeed,
  onMarkNewsViewed,
  onAddNewsCandidateToFunnel,
  recommendationsItems,
  recommendationsEmptyMessage,
  recommendationsError,
  recommendationsHasMore,
  isRecommendationsLoadingInitial,
  isRecommendationsLoadingMore,
  recommendationsFilter,
  onRecommendationsFilterChange,
  onLoadMoreRecommendations,
  onMarkRecommendationsViewed,
  onToggleRecommendationSubscription,
  onAddRecommendationCandidateToFunnel,
  onOpenCandidate,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: HrHomePageProps) {
  const newsListRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const viewedNewsIdsRef = useRef<Set<string>>(new Set());
  const recommendationsListRef = useRef<HTMLDivElement | null>(null);
  const recommendationsLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const viewedRecommendationsIdsRef = useRef<Set<string>>(new Set());
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const headerCopy = HR_HOME_COPY[activeTab];

  const newsIds = useMemo(
    () => newsFeedItems.map((item) => item.newsId).join("|"),
    [newsFeedItems],
  );
  const recommendationIds = useMemo(
    () => recommendationsItems.map((item) => item.recommendationId).join("|"),
    [recommendationsItems],
  );

  const handleTabValueChange = (value: string) => {
    if (value === "news" || value === "recommendations" || value === "summary") {
      onTabChange(value);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!newsFeedHasMore || isNewsFeedLoadingInitial || isNewsFeedLoadingMore) {
      return;
    }
    onLoadMoreNewsFeed();
  }, [
    isNewsFeedLoadingInitial,
    isNewsFeedLoadingMore,
    newsFeedHasMore,
    onLoadMoreNewsFeed,
  ]);

  const handleLoadMoreRecommendations = useCallback(() => {
    if (
      !recommendationsHasMore ||
      isRecommendationsLoadingInitial ||
      isRecommendationsLoadingMore
    ) {
      return;
    }
    onLoadMoreRecommendations();
  }, [
    isRecommendationsLoadingInitial,
    isRecommendationsLoadingMore,
    onLoadMoreRecommendations,
    recommendationsHasMore,
  ]);

  useEffect(() => {
    if (activeTab !== "news") return;
    const root = newsListRef.current;
    const sentinel = loadMoreRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore();
        }
      },
      { root, rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, handleLoadMore, newsIds]);

  useEffect(() => {
    if (activeTab !== "news") return;
    const root = newsListRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-news-id]"));
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const newlyViewed = entries.reduce<string[]>((acc, entry) => {
          if (!entry.isIntersecting) return acc;
          const newsId = (entry.target as HTMLElement).dataset.newsId;
          if (!newsId || viewedNewsIdsRef.current.has(newsId)) return acc;
          viewedNewsIdsRef.current.add(newsId);
          acc.push(newsId);
          observer.unobserve(entry.target);
          return acc;
        }, []);
        if (newlyViewed.length > 0) {
          onMarkNewsViewed(newlyViewed);
        }
      },
      { root, threshold: 0.5 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [activeTab, newsIds, onMarkNewsViewed]);

  useEffect(() => {
    if (activeTab !== "recommendations") return;
    const root = recommendationsListRef.current;
    const sentinel = recommendationsLoadMoreRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMoreRecommendations();
        }
      },
      { root, rootMargin: "320px 0px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, handleLoadMoreRecommendations, recommendationIds]);

  useEffect(() => {
    if (activeTab !== "recommendations") return;
    const root = recommendationsListRef.current;
    if (!root) return;
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-recommendation-id][data-candidate-id]"),
    );
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const newlyViewed = entries.reduce<string[]>((acc, entry) => {
          if (!entry.isIntersecting) return acc;
          const candidateId = (entry.target as HTMLElement).dataset.candidateId;
          if (
            !candidateId ||
            viewedRecommendationsIdsRef.current.has(candidateId)
          ) {
            return acc;
          }
          viewedRecommendationsIdsRef.current.add(candidateId);
          acc.push(candidateId);
          observer.unobserve(entry.target);
          return acc;
        }, []);
        if (newlyViewed.length > 0) {
          onMarkRecommendationsViewed(newlyViewed);
        }
      },
      { root, threshold: 0.5 },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [activeTab, recommendationIds, onMarkRecommendationsViewed]);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[680px] flex-col gap-4 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabValueChange}
        className="min-h-0 flex-1">
        <section className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Главная HR
            </p>
            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              {headerCopy.title}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {headerCopy.description}
            </p>
          </div>
          <TabsList className="ml-auto w-full sm:w-auto">
            <TabsTrigger value="news">Новости</TabsTrigger>
            <TabsTrigger value="recommendations">Рекомендации</TabsTrigger>
            <TabsTrigger value="summary">Сводка</TabsTrigger>
          </TabsList>
        </section>

        <TabsContent value="news" className="mt-4 min-h-0 h-[calc(100%-3rem)]">
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {isNewsFeedLoadingInitial ? (
              <div className="grid h-full place-items-center px-6 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Spinner className="size-8" />
                  <span className="text-sm">Загружаем новости...</span>
                </div>
              </div>
            ) : newsFeedItems.length === 0 ? (
              <div className="grid h-full place-items-center px-6 text-center text-muted-foreground">
                {newsFeedError ??
                  newsFeedEmptyMessage ??
                  "Нет новых достижений у отслеживаемых студентов. Загляните позже"}
              </div>
            ) : (
              <div ref={newsListRef} className="min-h-0 flex-1 overflow-auto p-4">
                <div className="flex w-full flex-col gap-3">
                  {newsFeedItems.map((item) => (
                    <HrNewsFeedCard
                      key={item.newsId}
                      item={item}
                      onOpenCandidate={onOpenCandidate}
                      onAddToFunnel={onAddNewsCandidateToFunnel}
                    />
                  ))}

                  {newsFeedError && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      {newsFeedError}
                    </p>
                  )}

                  <div ref={loadMoreRef} className="min-h-8" />

                  {isNewsFeedLoadingMore && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                      <Spinner className="size-5" />
                      Подгружаем новости...
                    </div>
                  )}

                  {!newsFeedHasMore && !isNewsFeedLoadingMore && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Больше новостей пока нет.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent
          value="recommendations"
          className="mt-4 min-h-0 h-[calc(100%-3rem)]">
          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={recommendationsFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onRecommendationsFilterChange("all")}>
                  Все рекомендации
                </Button>
                <Button
                  type="button"
                  variant={
                    recommendationsFilter === "my-events" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => onRecommendationsFilterChange("my-events")}>
                  По моим мероприятиям
                </Button>
              </div>
            </div>

            {isRecommendationsLoadingInitial ? (
              <div className="grid h-full place-items-center px-6 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Spinner className="size-8" />
                  <span className="text-sm">Загружаем рекомендации...</span>
                </div>
              </div>
            ) : recommendationsItems.length === 0 ? (
              <div className="grid h-full place-items-center px-6 text-center text-muted-foreground">
                {recommendationsError ??
                  recommendationsEmptyMessage ??
                  "Нет новых рекомендаций. Проверьте позже или измените фильтр"}
              </div>
            ) : (
              <div
                ref={recommendationsListRef}
                className="min-h-0 flex-1 overflow-auto p-4">
                <div className="flex w-full flex-col gap-3">
                  {recommendationsItems.map((item) => (
                    <HrRecommendationFeedCard
                      key={item.recommendationId}
                      item={item}
                      onOpenCandidate={onOpenCandidate}
                      onAddToFunnel={onAddRecommendationCandidateToFunnel}
                      onToggleSubscription={onToggleRecommendationSubscription}
                    />
                  ))}

                  {recommendationsError && (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                      {recommendationsError}
                    </p>
                  )}

                  <div ref={recommendationsLoadMoreRef} className="min-h-8" />

                  {isRecommendationsLoadingMore && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                      <Spinner className="size-5" />
                      Подгружаем рекомендации...
                    </div>
                  )}

                  {!recommendationsHasMore && !isRecommendationsLoadingMore && (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Больше рекомендаций пока нет.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="summary" className="mt-4 min-h-0 h-[calc(100%-3rem)]">
          <div className="grid h-full min-h-0 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-foreground">
                  Топ-3 по достижениям
                </h3>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                {topByAchievements.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Пока нет данных по достижениям.
                  </p>
                ) : (
                  topByAchievements.map((candidate, index) => (
                    <article
                      key={candidate.id}
                      className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${getRankClasses(index)}`}>
                            {index + 1}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => onOpenCandidate(candidate.id)}
                              className="cursor-pointer text-left text-sm font-semibold text-foreground hover:text-primary">
                              {candidate.name}
                            </button>
                            <p className="text-xs text-muted-foreground">
                              {candidate.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCandidateStatusClasses(candidate.candidateStatus)}`}>
                          {candidate.candidateStatus}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-muted-foreground">
                          Всего:{" "}
                          <span className="font-semibold text-foreground">
                            {candidate.totalAchievementsCount}
                          </span>
                        </div>
                        <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-muted-foreground">
                          Подтв.:{" "}
                          <span className="font-semibold text-foreground">
                            {candidate.confirmedAchievementsCount}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {candidate.university || "Вуз не указан"}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-600" />
                <h3 className="text-lg font-semibold text-foreground">
                  Топ-3 по подписчикам
                </h3>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                {topBySubscribers.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Пока нет данных по подпискам.
                  </p>
                ) : (
                  topBySubscribers.map((candidate, index) => (
                    <article
                      key={candidate.id}
                      className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${getRankClasses(index)}`}>
                            {index + 1}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => onOpenCandidate(candidate.id)}
                              className="cursor-pointer text-left text-sm font-semibold text-foreground hover:text-primary">
                              {candidate.name}
                            </button>
                            <p className="text-xs text-muted-foreground">
                              {candidate.email}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCandidateStatusClasses(candidate.candidateStatus)}`}>
                          {candidate.candidateStatus}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-muted-foreground">
                          Подписч.:{" "}
                          <span className="font-semibold text-foreground">
                            {candidate.subscriberCount}
                          </span>
                        </div>
                        <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-muted-foreground">
                          Достиж.:{" "}
                          <span className="font-semibold text-foreground">
                            {candidate.totalAchievementsCount}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {candidate.university || "Вуз не указан"}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-2 xl:col-span-1">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Уведомления
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
                  className="cursor-pointer text-xs font-medium text-primary hover:underline">
                  Прочитать все
                </button>
              </div>

              <div className="mb-3 rounded-lg border border-secondary/50 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                Непрочитанных:{" "}
                <span className="font-semibold text-foreground">
                  {unreadCount}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Пока нет уведомлений.
                  </p>
                ) : (
                  notifications.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-xl border p-3 ${
                        item.isRead
                          ? "border-border bg-background"
                          : "border-blue-200 bg-blue-50/60"
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onMarkNotificationRead(item.id)}
                          className="cursor-pointer text-left">
                          <p className="text-sm font-semibold text-foreground">
                            {item.title}
                          </p>
                        </button>
                        {!item.isRead && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                            <Star className="h-3 w-3" />
                            новое
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString("ru-RU")}
                      </p>

                      {item.candidateId && (
                        <button
                          type="button"
                          onClick={() => {
                            onMarkNotificationRead(item.id);
                            onOpenCandidate(item.candidateId as string);
                          }}
                          className="mt-2 inline-flex cursor-pointer items-center rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-secondary">
                          Открыть профиль кандидата
                        </button>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
