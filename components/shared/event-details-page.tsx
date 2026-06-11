"use client";

import {
  Event,
  EventApplication,
  OrganizationType,
  UserRole,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_LEVEL_LABELS,
  EVENT_TYPE_LABELS,
  formatEventPeriod,
  resolvePublicEventShareUrl,
  resolveEventQrCodeUrl,
} from "@/lib/event-meta";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  CalendarDays,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";
import { copyTextToClipboard } from "@/lib/share";

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
  onApproveApplication?: (applicationId: string) => void;
  onRejectApplication?: (applicationId: string) => void;
  onOpenUploadResults?: (eventId: string) => void;
  canOpenUploadResults?: boolean;
  onEditEvent?: (eventId: string) => void;
  onDeleteEvent?: (eventId: string) => void | Promise<void>;
  isDeletingEvent?: boolean;
  applicationsLoading?: boolean;
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
  onApproveApplication,
  onRejectApplication,
  onOpenUploadResults,
  canOpenUploadResults = true,
  onEditEvent,
  onDeleteEvent,
  isDeletingEvent = false,
  applicationsLoading = false,
  onBack,
}: EventDetailsPageProps) {
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
    university: "Вуз",
    scientific: "Научная организация",
    olympiad: "Олимпиадный комитет",
    conference: "Конференц-организатор",
    foundation: "Фонд",
    educational: "Образовательная платформа",
    other: "Другое",
  };

  const handleCopyPublicLink = async () => {
    try {
      const link = resolvePublicEventShareUrl(event.id);
      await copyTextToClipboard(link);
      setShareMessage("Ссылка на публичную страницу скопирована.");
      showSuccessToast("Ссылка скопирована");
    } catch {
      setShareMessage("Не удалось скопировать ссылку.");
      showErrorToast("Не удалось скопировать ссылку.");
    }
  };

  const resolvedQrCodeUrl = resolveEventQrCodeUrl(event.qrCodeUrl);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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

        {role === "organizer" && (onEditEvent || onDeleteEvent) && (
          <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            {onEditEvent && (
              <button
                type="button"
                onClick={() => onEditEvent(event.id)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-secondary">
                <Pencil className="w-4 h-4" />
                Редактировать
              </button>
            )}
            {onDeleteEvent && (
              <button
                type="button"
                onClick={() => void onDeleteEvent(event.id)}
                disabled={isDeletingEvent}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60">
                <Trash2 className="w-4 h-4" />
                {isDeletingEvent ? "Удаление..." : "Удалить"}
              </button>
            )}
          </div>
        )}
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
              {`Заявок на участие: ${event.applicationsCount}`}
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

        <div className="border border-border rounded-lg p-4 bg-secondary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Публичная страница мероприятия
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Поделитесь ссылкой для регистрации участников
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
            <Link2 className="w-4 h-4" />
            Скопировать ссылку
          </button>
        </div>
        {shareMessage && (
          <p className="text-xs text-muted-foreground">{shareMessage}</p>
        )}

        {role === "organizer" && resolvedQrCodeUrl && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              QR-код мероприятия
            </h3>
            <img
              src={resolvedQrCodeUrl}
              alt="QR-код мероприятия"
              className="h-40 w-40 rounded-lg border border-border bg-white p-2"
            />
          </div>
        )}

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
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={canOpenUploadResults ? -1 : 0}>
                    <button
                      type="button"
                      onClick={() => onOpenUploadResults?.(event.id)}
                      disabled={!canOpenUploadResults}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                      Перейти к загрузке результатов
                    </button>
                  </span>
                </TooltipTrigger>
                {!canOpenUploadResults && (
                  <TooltipContent side="bottom" sideOffset={8}>
                    Нет подтверждённых учащихся для загрузки результатов.
                  </TooltipContent>
                )}
              </Tooltip>
            </div>

            {applicationsLoading && applications.length === 0 ? (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-44" />
              </div>
            ) : applications.length === 0 ? (
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-foreground">
                        Статус
                      </th>
                      {(onApproveApplication || onRejectApplication) && (
                        <th className="px-4 py-3 text-right text-xs font-semibold text-foreground">
                          Действие
                        </th>
                      )}
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
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {application.status === "APPROVED"
                            ? "Подтверждено"
                            : application.status === "REJECTED"
                              ? "Отклонено"
                              : application.status === "WITHDRAWN"
                                ? "Отозвана"
                                : "На рассмотрении"}
                        </td>
                        {(onApproveApplication || onRejectApplication) && (
                          <td className="px-4 py-3 text-right">
                            {application.status === "APPROVED" ? (
                              <div className="inline-flex items-center gap-2">
                                {onRejectApplication && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRejectApplication(application.id)
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-secondary">
                                    Отклонить
                                  </button>
                                )}
                              </div>
                            ) : application.status === "REJECTED" ? (
                              <div className="inline-flex items-center gap-2">
                                {onApproveApplication && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onApproveApplication(application.id)
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-secondary">
                                    Вернуть
                                  </button>
                                )}
                              </div>
                            ) : application.status === "WITHDRAWN" ? (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            ) : (
                              <div className="inline-flex items-center gap-2">
                                {onApproveApplication && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onApproveApplication(application.id)
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-[var(--verified)] text-white text-xs hover:opacity-90">
                                    Принять
                                  </button>
                                )}
                                {onRejectApplication && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRejectApplication(application.id)
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-secondary">
                                    Отклонить
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
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

        {role !== "hr" && role !== "organizer" && resolvedQrCodeUrl && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              QR для регистрации
            </h3>
            <img
              src={resolvedQrCodeUrl}
              alt="QR-код мероприятия"
              className="w-40 h-40 rounded-lg border border-border bg-white p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
