"use client";

import { Event, EventApplication, Participant } from "@/lib/types";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import {
  EVENT_LEVEL_LABELS,
  EVENT_TYPE_LABELS,
  formatEventPeriod,
} from "@/lib/event-meta";

const RESULT_OPTIONS = [
  "1 место",
  "2 место",
  "3 место",
  "Призёр",
  "Участник",
  "Медаль",
  "Сертификат",
];

interface UploadResultsProps {
  event: Event;
  applications?: EventApplication[];
  onBack: () => void;
  onPublish: (eventId: string, participants: Participant[]) => void;
}

export function UploadResults({
  event,
  applications = [],
  onBack,
  onPublish,
}: UploadResultsProps) {
  const participantsSource: Omit<Participant, "result">[] = applications.map(
    (item) => ({
      id: item.id,
      studentId: item.studentId,
      studentName: item.studentName,
    }),
  );

  const [results, setResults] = useState<Record<string, string>>(
    Object.fromEntries(participantsSource.map((p) => [p.id, "Участник"])),
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(participantsSource.map((p) => [p.id, ""])),
  );

  const handlePublish = () => {
    if (participantsSource.length === 0) return;

    const participants: Participant[] = participantsSource.map((p) => ({
      ...p,
      result: comments[p.id]?.trim()
        ? `${results[p.id] || "Участник"} (${comments[p.id].trim()})`
        : results[p.id] || "Участник",
    }));
    onPublish(event.id, participants);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Загрузка результатов
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">{event.title}</p>
        </div>
      </div>

      {/* Event summary */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg px-5 py-3 flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Тип: </span>
          <span className="font-medium text-foreground">
            {EVENT_TYPE_LABELS[event.type]}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Уровень: </span>
          <span className="font-medium text-foreground">
            {EVENT_LEVEL_LABELS[event.level]}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Дата: </span>
          <span className="font-medium text-foreground">
            {formatEventPeriod(event)}
          </span>
        </div>
      </div>

      {/* Participants table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-secondary">
          <p className="text-sm font-semibold text-foreground">
            Таблица участников
          </p>
        </div>
        {participantsSource.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            Нет заявок на участие. Отображаются только пользователи, подавшие
            заявку.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                  Имя
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                  Результат
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                  Комментарий
                </th>
              </tr>
            </thead>
            <tbody>
              {participantsSource.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-5 py-3 text-sm text-foreground">
                    {p.studentName}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={results[p.id]}
                      onChange={(e) =>
                        setResults((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      {RESULT_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="text"
                      value={comments[p.id] ?? ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      placeholder="Комментарий (необязательно)"
                      className="w-full min-w-[220px] px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handlePublish}
          disabled={participantsSource.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
          <Send className="w-4 h-4" />
          Опубликовать результаты
        </button>
        <button
          onClick={onBack}
          className="px-5 py-2.5 border border-border rounded-lg hover:bg-secondary transition-colors text-sm">
          Отмена
        </button>
      </div>
    </div>
  );
}
