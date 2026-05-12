"use client";

import {
  Event,
  OrganizerEventFormat,
  OrganizerEventLevel,
  OrganizerEventStatus,
  OrganizerEventType,
} from "@/lib/types";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_LEVEL_OPTIONS,
  EVENT_STATUS_OPTIONS,
  EVENT_TYPE_OPTIONS,
} from "@/lib/event-meta";
import { useEventForm } from "@/hooks/use-event-form";
import { EventFormPayload } from "@/stores/events-store";
import { CustomFieldsEditor } from "@/components/events/custom-fields-editor";
import { ArrowLeft } from "lucide-react";

interface EventFormProps {
  initialEvent?: Event;
  defaultContactEmail?: string;
  onBack: () => void;
  onSave: (data: EventFormPayload) => void;
}

export function EventForm({
  initialEvent,
  defaultContactEmail,
  onBack,
  onSave,
}: EventFormProps) {
  const form = useEventForm(initialEvent, defaultContactEmail);

  const inputClass = (error?: string) =>
    `w-full px-4 py-2.5 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
      error ? "border-destructive" : "border-border"
    }`;

  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.validate()) return;
    onSave(form.getPayload());
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
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
        <div>
          <label className={labelClass}>
            Название <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={form.values.title}
            onChange={(e) => form.set.title(e.target.value)}
            placeholder="Название мероприятия"
            className={inputClass(form.errors.title)}
          />
          {form.errors.title && (
            <p className="text-destructive text-xs mt-1">{form.errors.title}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Тип <span className="text-destructive">*</span>
            </label>
            <select
              value={form.values.type}
              onChange={(e) =>
                form.set.type(e.target.value as OrganizerEventType)
              }
              className={inputClass(form.errors.type)}>
              {EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>
              Уровень <span className="text-destructive">*</span>
            </label>
            <select
              value={form.values.level}
              onChange={(e) =>
                form.set.level(e.target.value as OrganizerEventLevel)
              }
              className={inputClass(form.errors.level)}>
              {EVENT_LEVEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>
              Дата начала <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={form.values.start}
              onChange={(e) => form.set.start(e.target.value)}
              className={inputClass(form.errors.start)}
            />
            {form.errors.start && (
              <p className="text-destructive text-xs mt-1">
                {form.errors.start}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Дата окончания <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={form.values.end}
              onChange={(e) => form.set.end(e.target.value)}
              className={inputClass(form.errors.end)}
            />
            {form.errors.end && (
              <p className="text-destructive text-xs mt-1">{form.errors.end}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>
              Дедлайн регистрации <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={form.values.registrationDeadline}
              onChange={(e) => form.set.registrationDeadline(e.target.value)}
              className={inputClass(form.errors.registrationDeadline)}
            />
            {form.errors.registrationDeadline && (
              <p className="text-destructive text-xs mt-1">
                {form.errors.registrationDeadline}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Формат <span className="text-destructive">*</span>
            </label>
            <select
              value={form.values.format}
              onChange={(e) =>
                form.set.format(e.target.value as OrganizerEventFormat)
              }
              className={inputClass(form.errors.format)}>
              {EVENT_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Местоположение</label>
            <input
              type="text"
              value={form.values.location}
              onChange={(e) => form.set.location(e.target.value)}
              placeholder="Город, адрес (для очных мероприятий)"
              className={inputClass(form.errors.location)}
            />
            {form.errors.location && (
              <p className="text-destructive text-xs mt-1">
                {form.errors.location}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>
            Описание <span className="text-destructive">*</span>
          </label>
          <textarea
            value={form.values.description}
            onChange={(e) => form.set.description(e.target.value)}
            placeholder="Подробное описание мероприятия"
            rows={4}
            className={`${inputClass()} resize-none`}
          />
          {form.errors.description && (
            <p className="text-destructive text-xs mt-1">
              {form.errors.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Сайт мероприятия</label>
            <input
              type="url"
              value={form.values.website}
              onChange={(e) => form.set.website(e.target.value)}
              placeholder="https://..."
              className={inputClass(form.errors.website)}
            />
            {form.errors.website && (
              <p className="text-destructive text-xs mt-1">
                {form.errors.website}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              Контактный email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={form.values.contactEmail}
              onChange={(e) => form.set.contactEmail(e.target.value)}
              placeholder="events@organization.ru"
              className={inputClass(form.errors.contactEmail)}
            />
            {form.errors.contactEmail && (
              <p className="text-destructive text-xs mt-1">
                {form.errors.contactEmail}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>URL логотипа</label>
            <input
              type="url"
              value={form.values.logoUrl}
              onChange={(e) => form.set.logoUrl(e.target.value)}
              placeholder="https://.../logo.png"
              className={inputClass()}
            />
          </div>
          <div>
            <label className={labelClass}>URL баннера</label>
            <input
              type="url"
              value={form.values.bannerUrl}
              onChange={(e) => form.set.bannerUrl(e.target.value)}
              placeholder="https://.../banner.png"
              className={inputClass()}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Статус</label>
          <select
            value={form.values.status}
            onChange={(e) =>
              form.set.status(e.target.value as OrganizerEventStatus)
            }
            className={inputClass()}>
            {EVENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <CustomFieldsEditor
          fields={form.values.customFields}
          error={form.errors.customFields}
          onAdd={form.addCustomField}
          onRemove={form.removeCustomField}
          onUpdate={form.updateCustomField}
        />

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
