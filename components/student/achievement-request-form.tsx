"use client";

import { AchievementLevel, Event, EventType } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface OrganizerOption {
  id: string;
  label: string;
  email?: string;
}

interface AchievementRequestFormProps {
  organizerOptions: OrganizerOption[];
  events: Event[];
  onBack: () => void;
  onSubmit: (payload: {
    eventId?: string;
    title: string;
    level: AchievementLevel;
    date: string;
    result: string;
    eventType: EventType;
    requestedOrganizerId: string;
    eventNotInList: boolean;
    requestComment?: string;
    newEvent?: {
      title: string;
      description: string;
      registrationDeadline?: string;
      format: "offline" | "online" | "hybrid";
      location?: string;
      website?: string;
      contactEmail: string;
    };
  }) => void;
}

const LEVEL_OPTIONS: AchievementLevel[] = [
  "Международный",
  "Всероссийский",
  "Региональный",
  "Вузовский",
  "Факультетский",
];

const EVENT_TYPE_OPTIONS: EventType[] = [
  "Олимпиада",
  "Конкурс",
  "Хакатон",
  "Конференция",
  "Чемпионат",
  "Другое",
];

export function AchievementRequestForm({
  organizerOptions,
  events,
  onBack,
  onSubmit,
}: AchievementRequestFormProps) {
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<AchievementLevel>("Региональный");
  const [date, setDate] = useState("");
  const [result, setResult] = useState("");
  const [eventType, setEventType] = useState<EventType>("Олимпиада");
  const [requestedOrganizerId, setRequestedOrganizerId] = useState(
    organizerOptions[0]?.id ?? "",
  );
  const [eventId, setEventId] = useState("");
  const [eventNotInList, setEventNotInList] = useState(false);
  const [requestComment, setRequestComment] = useState("");
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventRegistrationDeadline, setNewEventRegistrationDeadline] =
    useState("");
  const [newEventFormat, setNewEventFormat] = useState<
    "offline" | "online" | "hybrid"
  >("online");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventWebsite, setNewEventWebsite] = useState("");
  const [newEventContactEmail, setNewEventContactEmail] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredOrganizerOptions = organizerOptions.filter((option) =>
    option.label.toLowerCase().includes(companyQuery.trim().toLowerCase()),
  );

  const availableEvents = useMemo(
    () =>
      events
        .filter((item) => item.organizerId === requestedOrganizerId)
        .sort(
          (a, b) =>
            new Date(b.dates.start).getTime() -
            new Date(a.dates.start).getTime(),
        ),
    [events, requestedOrganizerId],
  );

  const selectedOrganizerEmail =
    organizerOptions.find((option) => option.id === requestedOrganizerId)
      ?.email ?? "";

  useEffect(() => {
    if (!selectedOrganizerEmail) return;
    setNewEventContactEmail(selectedOrganizerEmail);
  }, [selectedOrganizerEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!title.trim()) {
      setError("Укажите название достижения.");
      return;
    }

    if (!date) {
      setError("Укажите дату достижения.");
      return;
    }

    const achievementDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(achievementDate.getTime()) || achievementDate >= today) {
      setError("Достижение можно добавить только за прошедшую дату.");
      return;
    }

    if (!result.trim()) {
      setError("Укажите результат.");
      return;
    }

    if (!requestedOrganizerId) {
      setError("Выберите организацию для подтверждения.");
      return;
    }
    if (!eventNotInList && !eventId) {
      setError("Выберите мероприятие, к которому относится достижение.");
      return;
    }

    if (eventNotInList) {
      if (!newEventTitle.trim()) {
        setError("Укажите название нового мероприятия.");
        return;
      }
      if (!newEventDescription.trim()) {
        setError("Укажите описание нового мероприятия.");
        return;
      }
      if (!newEventContactEmail.trim()) {
        setError("Укажите контактный email нового мероприятия.");
        return;
      }

      if (newEventRegistrationDeadline) {
        const deadline = new Date(`${newEventRegistrationDeadline}T00:00:00`);
        if (Number.isNaN(deadline.getTime()) || deadline > achievementDate) {
          setError("Дедлайн регистрации не может быть позже даты достижения.");
          return;
        }
      }
    }

    onSubmit({
      eventId: eventNotInList ? undefined : eventId,
      title: title.trim(),
      level,
      date,
      result: result.trim(),
      eventType,
      requestedOrganizerId,
      eventNotInList,
      requestComment: requestComment.trim() || undefined,
      newEvent: eventNotInList
        ? {
            title: newEventTitle.trim(),
            description: newEventDescription.trim(),
            registrationDeadline: newEventRegistrationDeadline || undefined,
            format: newEventFormat,
            location: newEventLocation.trim() || undefined,
            website: newEventWebsite.trim() || undefined,
            contactEmail: newEventContactEmail.trim(),
          }
        : undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Добавить достижение
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Создайте запрос на подтверждение для выбранной организации
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Название достижения
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
            placeholder="Например: Региональная олимпиада по математике"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Уровень
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as AchievementLevel)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
              {LEVEL_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Тип мероприятия
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
              {EVENT_TYPE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Результат
          </label>
          <input
            type="text"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
            placeholder="Например: 2 место"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Организация для подтверждения
          </label>
          <input
            type="text"
            value={companyQuery}
            onChange={(e) => setCompanyQuery(e.target.value)}
            placeholder="Поиск по компаниям"
            className="w-full mb-2 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
          />
          <select
            value={requestedOrganizerId}
            onChange={(e) => {
              setRequestedOrganizerId(e.target.value);
              setEventId("");
            }}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
            {filteredOrganizerOptions.length === 0 ? (
              <option value="">Нет доступных организаций</option>
            ) : (
              filteredOrganizerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Мероприятие
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-foreground mb-2">
            <input
              type="checkbox"
              checked={eventNotInList}
              onChange={(e) => {
                setEventNotInList(e.target.checked);
                if (e.target.checked) {
                  setEventId("");
                }
              }}
            />
            Мероприятия нет в списке
          </label>

          {!eventNotInList ? (
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
              <option value="">Выберите мероприятие</option>
              {availableEvents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          ) : (
            <div className="mt-2 space-y-3 border border-amber-300 bg-amber-50 rounded-lg p-4">
              <p className="text-xs text-amber-800">
                Заполните данные мероприятия. Оно будет создано вместе с
                достижением.
              </p>
              <p className="text-xs text-amber-800/90">
                Дата начала и окончания нового мероприятия будут равны дате
                достижения.
              </p>
              <input
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Название мероприятия"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
              />
              <textarea
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Описание мероприятия"
                rows={3}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
              />
              <input
                type="date"
                value={newEventRegistrationDeadline}
                onChange={(e) =>
                  setNewEventRegistrationDeadline(e.target.value)
                }
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                placeholder="Дедлайн регистрации (необязательно)"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={newEventFormat}
                  onChange={(e) =>
                    setNewEventFormat(
                      e.target.value as "offline" | "online" | "hybrid",
                    )
                  }
                  className="px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
                  <option value="online">Онлайн</option>
                  <option value="offline">Очно</option>
                  <option value="hybrid">Гибрид</option>
                </select>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Локация (опционально)"
                  className="px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="email"
                  value={newEventContactEmail}
                  onChange={(e) => setNewEventContactEmail(e.target.value)}
                  placeholder="Контактный email мероприятия"
                  className="px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                />
                <input
                  type="url"
                  value={newEventWebsite}
                  onChange={(e) => setNewEventWebsite(e.target.value)}
                  placeholder="Сайт (опционально)"
                  className="px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Комментарий (необязательно)
          </label>
          <textarea
            value={requestComment}
            onChange={(e) => setRequestComment(e.target.value)}
            rows={3}
            placeholder="Дополнительные детали для организатора"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            disabled={organizerOptions.length === 0}>
            Отправить на подтверждение
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
