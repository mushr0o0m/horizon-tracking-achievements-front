"use client";

import { Event, Participant } from "@/lib/types";
import { useState } from "react";
import { ArrowLeft, Send } from "lucide-react";

const MOCK_PARTICIPANTS: Omit<Participant, "result">[] = [
  {
    id: "p-1",
    studentId: "student-1",
    studentName: "Иванов Алексей Сергеевич",
  },
  { id: "p-2", studentId: "student-2", studentName: "Петрова Мария Ивановна" },
  {
    id: "p-3",
    studentId: "student-3",
    studentName: "Сидоров Дмитрий Алексеевич",
  },
  { id: "p-4", studentId: "student-4", studentName: "Козлова Анна Сергеевна" },
];

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
  onBack: () => void;
  onPublish: (eventId: string, participants: Participant[]) => void;
}

export function UploadResults({
  event,
  onBack,
  onPublish,
}: UploadResultsProps) {
  const [results, setResults] = useState<Record<string, string>>(
    Object.fromEntries(MOCK_PARTICIPANTS.map((p) => [p.id, "Участник"])),
  );

  const handlePublish = () => {
    const participants: Participant[] = MOCK_PARTICIPANTS.map((p) => ({
      ...p,
      result: results[p.id] || "Участник",
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
          <span className="font-medium text-foreground">{event.type}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Уровень: </span>
          <span className="font-medium text-foreground">{event.level}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Дата: </span>
          <span className="font-medium text-foreground">
            {new Date(event.date).toLocaleDateString("ru-RU")}
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
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                Имя
              </th>
              <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                Результат
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PARTICIPANTS.map((p) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handlePublish}
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
