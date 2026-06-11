"use client";

import { Achievement, Event } from "@/lib/types";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface AchievementDetailsModalProps {
  achievement: Achievement | null;
  event?: Event;
  isEventLoading?: boolean;
  isVisibleInPublic?: boolean;
  onToggleVisible?: (nextValue: boolean) => void;
  onClose: () => void;
  onOpenEvent?: (eventId: string) => void;
  extraContent?: ReactNode;
}

export function AchievementDetailsModal({
  achievement,
  event,
  isEventLoading = false,
  isVisibleInPublic,
  onToggleVisible,
  onClose,
  onOpenEvent,
  extraContent,
}: AchievementDetailsModalProps) {
  if (!achievement) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-lg font-semibold text-foreground">
            Информация о достижении
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-secondary"
            aria-label="Закрыть">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-sm">
          <div>
            <p className="text-muted-foreground">Название</p>
            <p className="mt-1 font-medium text-foreground">
              {achievement.title}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Уровень</p>
              <p className="mt-1 font-medium text-foreground">
                {achievement.level}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Тип</p>
              <p className="mt-1 font-medium text-foreground">
                {achievement.eventType ?? "Не указан"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Дата</p>
              <p className="mt-1 font-medium text-foreground">
                {new Date(achievement.date).toLocaleDateString("ru-RU")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Результат</p>
              <p className="mt-1 font-medium text-foreground">
                {achievement.result}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/20 p-3">
            <p className="text-muted-foreground">Мероприятие</p>
            {event ? (
              <div className="mt-1 space-y-2">
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(event.dates.start).toLocaleDateString("ru-RU")} - {" "}
                  {new Date(event.dates.end).toLocaleDateString("ru-RU")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.contactEmail}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenEvent?.(event.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary">
                  Открыть мероприятие
                </button>
              </div>
            ) : isEventLoading ? (
              <p className="mt-1 text-foreground">
                Загружаем информацию о мероприятии...
              </p>
            ) : (
              <p className="mt-1 text-foreground">Мероприятие не найдено</p>
            )}
          </div>

          {typeof isVisibleInPublic === "boolean" && onToggleVisible ? (
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isVisibleInPublic}
                onChange={(e) => onToggleVisible(e.target.checked)}
              />
              Отображать в публичной визитке
            </label>
          ) : null}

          {extraContent}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalContent, document.body);
}
