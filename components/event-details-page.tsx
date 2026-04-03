"use client";

import {
  Event,
  EventApplication,
  OrganizationType,
  UserRole,
} from "@/lib/types";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_LEVEL_LABELS,
  EVENT_TYPE_LABELS,
  formatEventPeriod,
} from "@/lib/event-meta";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { ArrowLeft, CalendarDays, Mail, MapPin, Users } from "lucide-react";

interface EventDetailsPageProps {
  event: Event;
  organizerInfo?: {
    organizationName: string;
    shortName?: string;
    organizationType?: OrganizationType;
    description?: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  role: UserRole;
  applications: EventApplication[];
  isApplied?: boolean;
  onToggleApplication?: () => void;
  onOpenUploadResults?: (eventId: string) => void;
  onBack: () => void;
}

const EVENT_FORMAT_LABELS = Object.fromEntries(
  EVENT_FORMAT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<Event["format"], string>;

export function EventDetailsPage({
  event,
  organizerInfo,
  role,
  applications,
  isApplied = false,
  onToggleApplication,
  onOpenUploadResults,
  onBack,
}: EventDetailsPageProps) {
  const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
    university: "Вуз",
    scientific: "Научная организация",
    olympiad: "Олимпиадный комитет",
    conference: "Конференц-организатор",
    foundation: "Фонд",
    educational: "Образовательная платформа",
    other: "Другое",
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Назад">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{event.title}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Полная информация о мероприятии
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          <EventStatusBadge status={event.status} />
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground">
            {EVENT_TYPE_LABELS[event.type]}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground">
            {EVENT_LEVEL_LABELS[event.level]}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground">
            {EVENT_FORMAT_LABELS[event.format]}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-secondary/40 border border-border rounded-lg p-4">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              Период проведения
            </div>
            <div className="mt-1 text-foreground font-medium">
              {formatEventPeriod(event)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Регистрация до:{" "}
              {new Date(event.dates.registrationDeadline).toLocaleDateString(
                "ru-RU",
              )}
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-4">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              Участники
            </div>
            <div className="mt-1 text-foreground font-medium">
              Участников: {event.participantsCount}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Заявок на участие: {applications.length}
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-4">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              Местоположение
            </div>
            <div className="mt-1 text-foreground font-medium">
              {event.location?.trim() ? event.location : "Онлайн / не указано"}
            </div>
          </div>

          <div className="bg-secondary/40 border border-border rounded-lg p-4">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              Контакты
            </div>
            <div className="mt-1 text-foreground font-medium break-all">
              {event.contactEmail}
            </div>
            {event.website.trim() && (
              <a
                href={event.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-primary hover:underline break-all">
                {event.website}
              </a>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Описание</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Профиль организации
          </h3>
          <div className="border border-border rounded-lg p-4 bg-secondary/20 space-y-2 text-sm">
            <div className="font-medium text-foreground">
              {organizerInfo?.organizationName || "Организатор"}
              {organizerInfo?.shortName ? ` (${organizerInfo.shortName})` : ""}
            </div>
            {organizerInfo?.organizationType && (
              <div className="text-muted-foreground">
                Тип: {ORGANIZATION_TYPE_LABELS[organizerInfo.organizationType]}
              </div>
            )}
            {organizerInfo?.description && (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {organizerInfo.description}
              </p>
            )}
            <div className="text-muted-foreground">
              Email: {organizerInfo?.contactEmail || event.contactEmail}
            </div>
            {organizerInfo?.contactPhone && (
              <div className="text-muted-foreground">
                Телефон: {organizerInfo.contactPhone}
              </div>
            )}
            {(organizerInfo?.website || event.website) && (
              <a
                href={organizerInfo?.website || event.website}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-primary hover:underline break-all">
                {organizerInfo?.website || event.website}
              </a>
            )}
          </div>
        </div>

        {role === "student" && (
          <div className="border border-border rounded-lg p-4 bg-secondary/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Участие в мероприятии
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isApplied
                  ? "Заявка отправлена. Вы можете отозвать ее до начала мероприятия."
                  : "Нажмите кнопку, чтобы подать заявление на участие."}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleApplication}
              className={
                isApplied
                  ? "px-4 py-2 rounded-lg border border-border hover:bg-secondary text-sm"
                  : "px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              }>
              {isApplied ? "Отозвать заявление" : "Подать заявление"}
            </button>
          </div>
        )}

        {role === "organizer" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Заявки на участие
              </h3>
              <button
                type="button"
                onClick={() => onOpenUploadResults?.(event.id)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
                Перейти к загрузке результатов
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="border border-border rounded-lg p-4 text-sm text-muted-foreground">
                Пока нет заявок на участие.
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                        ФИО
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                        Дата заявки
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr
                        key={application.id}
                        className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {application.studentName}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(application.appliedAt).toLocaleString(
                            "ru-RU",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {event.customFields.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Дополнительные поля регистрации
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {event.customFields.map((field) => (
                <div
                  key={field.id}
                  className="text-sm border border-border rounded-lg p-3 bg-background/40">
                  <div className="font-medium text-foreground">
                    {field.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Тип: {field.type}
                    {field.required ? " · Обязательное" : " · Необязательное"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {event.qrCodeUrl && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              QR для регистрации
            </h3>
            <img
              src={event.qrCodeUrl}
              alt="QR-код мероприятия"
              className="w-40 h-40 rounded-lg border border-border bg-white p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
