"use client";

import { Event, EventType, AchievementLevel } from "@/lib/types";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

const LEVELS: AchievementLevel[] = [
  "Международный",
  "Всероссийский",
  "Региональный",
  "Вузовский",
  "Факультетский",
];
const EVENT_TYPES: EventType[] = [
  "Олимпиада",
  "Конкурс",
  "Хакатон",
  "Конференция",
  "Чемпионат",
  "Другое",
];

interface EventFormProps {
  initialEvent?: Event;
  onBack: () => void;
  onSave: (data: Omit<Event, "id" | "participantCount">) => void;
}

type FormErrors = Partial<Record<"title" | "level" | "type" | "date", string>>;

export function EventForm({ initialEvent, onBack, onSave }: EventFormProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [level, setLevel] = useState<AchievementLevel>(
    initialEvent?.level ?? "Региональный",
  );
  const [type, setType] = useState<EventType>(
    initialEvent?.type ?? "Олимпиада",
  );
  const [date, setDate] = useState(initialEvent?.date ?? "");
  const [description, setDescription] = useState(
    initialEvent?.description ?? "",
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!title.trim()) e.title = "Введите название";
    if (!date) e.date = "Выберите дату";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      title: title.trim(),
      level,
      type,
      date,
      description: description.trim() || undefined,
      status: initialEvent?.status ?? "Опубликовано",
    });
  };

  const inputClass = (error?: string) =>
    `w-full px-4 py-2.5 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
      error ? "border-destructive" : "border-border"
    }`;

  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {initialEvent ? "Редактировать мероприятие" : "Создать мероприятие"}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {initialEvent
              ? "Внесите изменения и сохраните"
              : "Заполните данные нового мероприятия"}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Title */}
        <div>
          <label className={labelClass}>
            Название <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название мероприятия"
            className={inputClass(errors.title)}
          />
          {errors.title && (
            <p className="text-destructive text-xs mt-1">{errors.title}</p>
          )}
        </div>

        {/* Level + Type row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Уровень <span className="text-destructive">*</span>
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as AchievementLevel)}
              className={inputClass(errors.level)}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Тип <span className="text-destructive">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EventType)}
              className={inputClass(errors.type)}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>
            Дата <span className="text-destructive">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass(errors.date)}
          />
          {errors.date && (
            <p className="text-destructive text-xs mt-1">{errors.date}</p>
          )}
        </div>

        {/* Description (optional) */}
        <div>
          <label className={labelClass}>
            Описание{" "}
            <span className="text-muted-foreground font-normal">
              (необязательно)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание мероприятия..."
            rows={3}
            className={`${inputClass()} resize-none`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
            Сохранить
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-2.5 border border-border rounded-lg hover:bg-secondary transition-colors text-sm">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
