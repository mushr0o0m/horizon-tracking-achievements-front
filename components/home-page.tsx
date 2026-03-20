"use client";

import { CURRENT_STUDENT } from "@/lib/data";
import { Achievement, Event } from "@/lib/types";
import {
  Sparkles,
  CalendarDays,
  Tag,
  Trophy,
  Target,
  ArrowUpRight,
} from "lucide-react";

interface HomePageProps {
  achievements: Achievement[];
  events: Event[];
}

export function HomePage({ achievements, events }: HomePageProps) {
  // Last 3 confirmed achievements sorted newest first
  const newAchievements = achievements
    .filter((a) => a.status === "Подтверждено")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Recommended: events from organizer that student hasn't participated in yet
  const studentEventIds = new Set(
    achievements.map((a) => a.eventId).filter(Boolean),
  );
  const recommendedEvents = events
    .filter((e) => e.status === "Опубликовано" && !studentEventIds.has(e.id))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  const confirmedCount = achievements.filter(
    (a) => a.status === "Подтверждено",
  ).length;
  const nextRecommendedEvent = recommendedEvents[0];

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-accent/10 to-background p-6 md:p-8">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 lg:gap-8 items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/70 border border-border px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Личный кабинет студента
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance leading-tight">
              Добро пожаловать, {CURRENT_STUDENT.name.split(" ")[1]}
            </h2>

            <p className="text-muted-foreground max-w-2xl">
              Здесь отображаются ваши новые достижения и ближайшие мероприятия,
              рекомендованные организаторами.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <div className="inline-flex items-center gap-2 rounded-lg bg-card/75 border border-border px-3 py-2 text-sm backdrop-blur">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Подтверждено:</span>
                <span className="font-semibold text-foreground">
                  {confirmedCount}
                </span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-card/75 border border-border px-3 py-2 text-sm backdrop-blur">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Рекомендовано:</span>
                <span className="font-semibold text-foreground">
                  {recommendedEvents.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/85 p-4 md:p-5 backdrop-blur space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Ближайшая возможность
            </p>
            {nextRecommendedEvent ? (
              <>
                <p className="font-semibold text-foreground leading-snug">
                  {nextRecommendedEvent.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {nextRecommendedEvent.type} · {nextRecommendedEvent.level}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-foreground">
                    {new Date(nextRecommendedEvent.date).toLocaleDateString(
                      "ru-RU",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-primary" />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Сейчас нет новых рекомендаций. Проверьте позже.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* New achievements */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Новые достижения
        </h3>
        {newAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="relative bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Новое
                </span>
                <div className="space-y-3 pt-1">
                  <p className="font-semibold text-foreground leading-snug pr-2">
                    {achievement.title}
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Уровень</span>
                      <span className="font-medium text-foreground">
                        {achievement.level}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Результат</span>
                      <span className="font-medium text-foreground">
                        {achievement.result}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                    Добавлено организатором
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg py-10 text-center text-muted-foreground">
            Новые достижения отсутствуют
          </div>
        )}
      </section>

      {/* Recommended events — driven by organizer-created events */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Рекомендуемые мероприятия
        </h3>
        {recommendedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedEvents.map((event) => (
              <div
                key={event.id}
                className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow space-y-3">
                <p className="font-semibold text-foreground leading-snug">
                  {event.title}
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {event.type} · {event.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {new Date(event.date).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg py-10 text-center text-muted-foreground">
            Нет рекомендуемых мероприятий
          </div>
        )}
      </section>
    </div>
  );
}
