"use client";

import { Achievement, Event } from "@/lib/types";
import { X } from "lucide-react";

interface AchievementDetailsModalProps {
  achievement: Achievement | null;
  event?: Event;
  isVisibleInPublic: boolean;
  onToggleVisible: (nextValue: boolean) => void;
  onClose: () => void;
  onOpenEvent?: (eventId: string) => void;
}

export function AchievementDetailsModal({
  achievement,
  event,
  isVisibleInPublic,
  onToggleVisible,
  onClose,
  onOpenEvent,
}: AchievementDetailsModalProps) {
  if (!achievement) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-background border border-border rounded-2xl shadow-xl">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Информация о достижении
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Закрыть">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">Название</p>
            <p className="font-medium text-foreground mt-1">
              {achievement.title}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground">Уровень</p>
              <p className="font-medium text-foreground mt-1">
                {achievement.level}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Тип</p>
              <p className="font-medium text-foreground mt-1">
                {achievement.eventType ?? "Не указан"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Дата</p>
              <p className="font-medium text-foreground mt-1">
                {new Date(achievement.date).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Результат</p>
              <p className="font-medium text-foreground mt-1">
                {achievement.result}
              </p>
            </div>
          </div>

          <div className="border border-border rounded-lg p-3 bg-secondary/20">
            <p className="text-muted-foreground">Мероприятие</p>
            {event ? (
              <div className="mt-1 space-y-2">
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.dates.start).toLocaleDateString("ru-RU")} -{" "}
                  {new Date(event.dates.end).toLocaleDateString("ru-RU")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.contactEmail}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenEvent?.(event.id)}
                  className="px-3 py-1.5 border border-border rounded-lg hover:bg-secondary text-xs">
                  Открыть мероприятие
                </button>
              </div>
            ) : (
              <p className="text-foreground mt-1">Мероприятие не найдено</p>
            )}
          </div>

          {achievement.verificationComment && (
            <div>
              <p className="text-muted-foreground">Комментарий</p>
              <p className="font-medium text-foreground mt-1">
                {achievement.verificationComment}
              </p>
            </div>
          )}

          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={isVisibleInPublic}
              onChange={(e) => onToggleVisible(e.target.checked)}
            />
            Отображать в публичной визитке
          </label>
        </div>
      </div>
    </div>
  );
}
