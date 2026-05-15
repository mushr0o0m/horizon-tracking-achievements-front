"use client";

import type { Event as AppEvent } from "@/lib/types";
import { Achievement, AuthUser } from "@/lib/types";
import {
  Sparkles,
  CalendarDays,
  Tag,
  Trophy,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { EVENT_LEVEL_LABELS, EVENT_TYPE_LABELS } from "@/lib/event-meta";
import {
  SubscriberPreviewItem,
  SubscribersPreviewCard,
} from "@/components/shared/subscribers-preview-card";

interface HomePageProps {
  achievements: Achievement[];
  recommendedEvents: AppEvent[];
  user: AuthUser;
  subscribers: SubscriberPreviewItem[];
  onOpenSubscribers: () => void;
  onOpenEvent: (eventId: string) => void;
  onOpenAchievement: (achievementId: string) => void;
  onOpenRecommendedEvents: () => void;
}

export function HomePage({
  achievements,
  recommendedEvents,
  user,
  subscribers,
  onOpenSubscribers,
  onOpenEvent,
  onOpenAchievement,
  onOpenRecommendedEvents,
}: HomePageProps) {
  // Last 3 confirmed achievements sorted newest first
  const newAchievements = achievements
    .filter((a) => a.status === "Подтверждено")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  const recommendedPreview = recommendedEvents.slice(0, 3);
  const confirmedCount = achievements.filter(
    (a) => a.status === "Подтверждено",
  ).length;
  const nextRecommendedEvent = recommendedPreview[0];
  const firstName = user.name.split(" ")[1] || user.name;

  return (
    <div className="relative z-10 flex flex-col gap-8 lg:gap-9">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/48 p-6 shadow-[0_26px_60px_-40px_rgba(38,72,142,0.8)] backdrop-blur-2xl md:p-8">
        <div className="student-float-fast absolute -right-16 -top-16 h-52 w-52 rounded-full bg-cyan-200/55 blur-3xl" />
        <div className="student-float-slow absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-pink-200/55 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.22)_45%,rgba(255,255,255,0.42)_100%)]" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8 items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-[0_10px_20px_-16px_rgba(44,74,136,0.95)] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              Личный кабинет ученика
            </div>

            <h2 className="text-balance text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Добро пожаловать, {firstName}
            </h2>

            <p className="max-w-2xl text-slate-700">
              Здесь отображаются ваши новые достижения и ближайшие мероприятия,
              рекомендованные организаторами.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 text-sm text-emerald-900 shadow-[0_14px_26px_-20px_rgba(17,129,91,0.92)] backdrop-blur">
                <Trophy className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-800/85">Подтверждено:</span>
                <span className="font-semibold text-emerald-900">
                  {confirmedCount}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-sky-200/75 bg-sky-50/72 px-3 py-2 text-sm text-sky-900 shadow-[0_14px_26px_-20px_rgba(10,105,181,0.86)] backdrop-blur">
                <Target className="h-4 w-4 text-sky-600" />
                <span className="text-sky-800/85">Рекомендовано:</span>
                <span className="font-semibold text-sky-900">
                  {recommendedEvents.length}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/65 bg-white/76 p-4 shadow-[0_22px_38px_-30px_rgba(51,87,154,0.95)] backdrop-blur-xl md:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              Ближайшая возможность
            </p>
            {nextRecommendedEvent ? (
              <button
                type="button"
                onClick={() => onOpenEvent(nextRecommendedEvent.id)}
                className="group w-full space-y-3 rounded-xl border border-transparent p-1 text-left transition-colors hover:border-white/70">
                <p className="leading-snug font-semibold text-slate-900">
                  {nextRecommendedEvent.title}
                </p>
                <p className="text-sm text-slate-600">
                  {EVENT_TYPE_LABELS[nextRecommendedEvent.type]} ·{" "}
                  {EVENT_LEVEL_LABELS[nextRecommendedEvent.level]}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-slate-800">
                    {new Date(
                      nextRecommendedEvent.dates.start,
                    ).toLocaleDateString("ru-RU", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-sky-600 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            ) : (
              <p className="text-sm text-slate-600">
                Сейчас нет новых рекомендаций. Проверьте позже.
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <SubscribersPreviewCard
          title="Подписчики профиля"
          description="HR, которые следят за вашими обновлениями"
          subscribers={subscribers}
          onOpen={onOpenSubscribers}
        />
      </section>

      {/* New achievements */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Новые достижения
        </h3>
        {newAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newAchievements.map((achievement) => (
              <button
                key={achievement.id}
                type="button"
                onClick={() => onOpenAchievement(achievement.id)}
                className="group relative rounded-2xl border border-white/55 bg-white/62 p-5 text-left shadow-[0_20px_40px_-30px_rgba(59,93,160,0.88)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_46px_-26px_rgba(66,92,151,0.85)]">
                <span className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                  <Sparkles className="h-3 w-3" />
                  Новое
                </span>
                <div className="space-y-3 pt-1">
                  <p className="pr-2 font-semibold leading-snug text-slate-900">
                    {achievement.title}
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Уровень</span>
                      <span className="font-medium text-slate-900">
                        {achievement.level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Результат</span>
                      <span className="font-medium text-slate-900">
                        {achievement.result}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-white/60 pt-2 text-xs text-slate-600">
                    Добавлено организатором
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/60 bg-white/66 py-10 text-center text-slate-600 shadow-[0_16px_40px_-34px_rgba(58,90,154,0.95)]">
            Новые достижения отсутствуют
          </div>
        )}
      </section>

      {/* Recommended events — driven by organizer-created events */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-foreground">
            Рекомендуемые мероприятия
          </h3>
          <button
            type="button"
            onClick={onOpenRecommendedEvents}
            className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Все рекомендации
          </button>
        </div>
        {recommendedPreview.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedPreview.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onOpenEvent(event.id)}
                className="group space-y-3 rounded-2xl border border-white/55 bg-white/62 p-5 text-left shadow-[0_20px_40px_-30px_rgba(59,93,160,0.86)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_46px_-26px_rgba(66,92,151,0.85)]">
                <p className="leading-snug font-semibold text-slate-900">
                  {event.title}
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Tag className="h-4 w-4 flex-shrink-0 text-sky-600" />
                    <span>
                      {EVENT_TYPE_LABELS[event.type]} ·{" "}
                      {EVENT_LEVEL_LABELS[event.level]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CalendarDays className="h-4 w-4 flex-shrink-0 text-sky-600" />
                    <span>
                      {new Date(event.dates.start).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="pt-1 text-xs font-medium text-sky-700 opacity-0 transition-opacity group-hover:opacity-100">
                  Открыть карточку мероприятия
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/60 bg-white/66 py-10 text-center text-slate-600 shadow-[0_16px_40px_-34px_rgba(58,90,154,0.95)]">
            Нет рекомендуемых мероприятий
          </div>
        )}
      </section>
    </div>
  );
}
