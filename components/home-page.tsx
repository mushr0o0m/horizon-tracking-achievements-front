'use client';

import { CURRENT_STUDENT } from '@/lib/data';
import { Achievement, Event } from '@/lib/types';
import { Sparkles, CalendarDays, Tag } from 'lucide-react';

interface HomePageProps {
  achievements: Achievement[];
  events: Event[];
}

export function HomePage({ achievements, events }: HomePageProps) {
  // Last 3 confirmed achievements sorted newest first
  const newAchievements = achievements
    .filter(a => a.status === 'Подтверждено')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Recommended: events from organizer that student hasn't participated in yet
  const studentEventIds = new Set(achievements.map(a => a.eventId).filter(Boolean));
  const recommendedEvents = events.filter(e => !studentEventIds.has(e.id)).slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <section className="space-y-1">
        <h2 className="text-3xl font-bold text-foreground text-balance">
          Добро пожаловать, {CURRENT_STUDENT.name.split(' ')[1]}
        </h2>
        <p className="text-muted-foreground">
          Ваши достижения обновляются автоматически на основе участия в мероприятиях
        </p>
      </section>

      {/* New achievements */}
      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Новые достижения</h3>
        {newAchievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newAchievements.map(achievement => (
              <div key={achievement.id} className="relative bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Новое
                </span>
                <div className="space-y-3 pt-1">
                  <p className="font-semibold text-foreground leading-snug pr-2">{achievement.title}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Уровень</span>
                      <span className="font-medium text-foreground">{achievement.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Результат</span>
                      <span className="font-medium text-foreground">{achievement.result}</span>
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
        <h3 className="text-xl font-semibold text-foreground">Рекомендуемые мероприятия</h3>
        {recommendedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedEvents.map(event => (
              <div key={event.id} className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow space-y-3">
                <p className="font-semibold text-foreground leading-snug">{event.title}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Tag className="w-4 h-4 flex-shrink-0" />
                    <span>{event.type} · {event.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {new Date(event.date).toLocaleDateString('ru-RU', {
                        year: 'numeric', month: 'long', day: 'numeric',
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
