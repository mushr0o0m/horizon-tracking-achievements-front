"use client";

import { AppNotification } from "@/lib/types";
import { HrFunnelStatus } from "@/lib/hr-funnel";
import { Bell, Star, Trophy, Users } from "lucide-react";

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

interface HrHomePageProps {
  topByAchievements: HrHomeTopAchievementCandidate[];
  topBySubscribers: HrHomeTopSubscriberCandidate[];
  notifications: AppNotification[];
  onOpenCandidate: (candidateId: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
}

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

export function HrHomePage({
  topByAchievements,
  topBySubscribers,
  notifications,
  onOpenCandidate,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: HrHomePageProps) {
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[680px] flex-col gap-4 overflow-hidden">
      <section className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-indigo-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Главная HR
        </p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Ключевая сводка по кандидатам
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Быстрый доступ к сильнейшим кандидатам и свежим уведомлениям.
        </p>
      </section>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-foreground">
              Топ-3 по достижениям
            </h3>
          </div>

          <div className="space-y-3">
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
                      Всего: <span className="font-semibold text-foreground">{candidate.totalAchievementsCount}</span>
                    </div>
                    <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-muted-foreground">
                      Подтв.: <span className="font-semibold text-foreground">{candidate.confirmedAchievementsCount}</span>
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

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-foreground">
              Топ-3 по подписчикам
            </h3>
          </div>

          <div className="space-y-3">
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
                      Подписч.: <span className="font-semibold text-foreground">{candidate.subscriberCount}</span>
                    </div>
                    <div className="rounded-md bg-secondary/60 px-2 py-1.5 text-muted-foreground">
                      Достиж.: <span className="font-semibold text-foreground">{candidate.totalAchievementsCount}</span>
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

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm lg:col-span-2 xl:col-span-1">
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
            Непрочитанных: <span className="font-semibold text-foreground">{unreadCount}</span>
          </div>

          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
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
                        new
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
    </div>
  );
}
