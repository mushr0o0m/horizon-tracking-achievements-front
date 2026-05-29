"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Link2,
  Mail,
  MapPin,
  QrCode,
  Users,
} from "lucide-react";
import { EventStatusBadge } from "@/components/events/event-status-badge";
import { PublicEventAuthDialog } from "@/components/public/public-event-auth-dialog";
import {
  backendGetProfile,
  fetchPublicEventById,
  fetchPublicOrganizerProfile,
} from "@/lib/backend-api";
import {
  buildPublicEventUrl,
  EVENT_FORMAT_OPTIONS,
  EVENT_LEVEL_LABELS,
  EVENT_TYPE_LABELS,
  resolveEventQrCodeUrl,
} from "@/lib/event-meta";
import type { Event, OrganizerOrganizationProfile, UserRole } from "@/lib/types";

const EVENT_FORMAT_LABELS = Object.fromEntries(
  EVENT_FORMAT_OPTIONS.map((option) => [option.value, option.label]),
) as Record<Event["format"], string>;

function formatDate(dateValue: string): string {
  if (!dateValue) return "Не указано";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("ru-RU");
}

export default function PublicEventPage() {
  const params = useParams<{ eventId?: string }>();
  const router = useRouter();
  const eventId = params?.eventId ?? "";

  const [event, setEvent] = useState<Event | null>(null);
  const [organizerInfo, setOrganizerInfo] =
    useState<OrganizerOrganizationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUserRole, setAuthUserRole] = useState<UserRole | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const publicUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    return eventId ? buildPublicEventUrl(eventId, origin) : "";
  }, [eventId]);

  const loadPage = useCallback(async () => {
    if (!eventId) {
      setError("Мероприятие не найдено.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const eventData = await fetchPublicEventById(eventId);
      setEvent(eventData);

      if (eventData.organizerId) {
        const organizer = await fetchPublicOrganizerProfile(eventData.organizerId);
        setOrganizerInfo(organizer);
      } else {
        setOrganizerInfo(null);
      }
    } catch (pageError) {
      setError("Не удалось загрузить мероприятие.");
      setEvent(null);
      setOrganizerInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const user = await backendGetProfile();
        if (!cancelled) setAuthUserRole(user.role);
      } catch {
        if (!cancelled) setAuthUserRole(null);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRegisterClick = () => {
    setMessage(null);
    if (!eventId) return;

    if (!authUserRole) {
      setAuthDialogOpen(true);
      return;
    }

    if (authUserRole !== "student") {
      setMessage("Регистрация доступна только студентам.");
      return;
    }

    router.push(
      `/student/event-details/view?eventId=${encodeURIComponent(
        eventId,
      )}&returnTo=${encodeURIComponent("/student/events/table")}`,
      { scroll: false },
    );
  };

  const handleStudentAuthSuccess = () => {
    setAuthUserRole("student");
    router.push(
      `/student/event-details/view?eventId=${encodeURIComponent(
        eventId,
      )}&returnTo=${encodeURIComponent("/student/events/table")}`,
      { scroll: false },
    );
  };

  const handleCopyLink = async () => {
    try {
      if (!publicUrl) {
        setMessage("Не удалось скопировать ссылку.");
        return;
      }
      await navigator.clipboard.writeText(publicUrl);
      setMessage("Ссылка скопирована.");
    } catch {
      setMessage("Не удалось скопировать ссылку.");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-5xl rounded-3xl border border-border bg-card p-8 md:p-12">
          <p className="text-sm text-muted-foreground">Загружаем мероприятие...</p>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 md:py-12">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-8 md:p-12 text-center">
          <h1 className="text-2xl font-bold text-foreground">Мероприятие не найдено</h1>
          <p className="mt-2 text-muted-foreground">
            {error ?? "Не удалось загрузить мероприятие."}
          </p>
          <button
            type="button"
            onClick={loadPage}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            Попробовать снова
          </button>
        </div>
      </main>
    );
  }

  const resolvedQrCodeUrl = resolveEventQrCodeUrl(event.qrCodeUrl);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:py-8 md:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {event.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.bannerUrl}
              alt=""
              className="h-44 w-full object-cover sm:h-56"
            />
          ) : (
            <div className="h-44 w-full bg-[linear-gradient(133deg,rgb(67_56_202)_0%,rgb(124_58_237)_45%,rgb(13_148_136)_100%)] sm:h-56" />
          )}

          <div className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge status={event.status} />
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                {EVENT_TYPE_LABELS[event.type]}
              </span>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                {EVENT_LEVEL_LABELS[event.level]}
              </span>
              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                {EVENT_FORMAT_LABELS[event.format]}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
                {event.title}
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                {event.description || "Описание мероприятия появится позже."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-xl border border-border bg-background p-4">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  Дата
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDate(event.dates.start)} - {formatDate(event.dates.end)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Регистрация до: {formatDate(event.dates.registrationDeadline)}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-background p-4">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4 text-teal-500" />
                  Место
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {event.location?.trim() ? event.location : "Онлайн"}
                </p>
              </article>
              <article className="rounded-xl border border-border bg-background p-4">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4 text-violet-500" />
                  Участники
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {event.participantsCount} участников
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.applicationsCount} заявок
                </p>
              </article>
              <article className="rounded-xl border border-border bg-background p-4">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4 text-sky-500" />
                  Контакты
                </div>
                <p className="mt-2 break-all text-sm font-medium text-foreground">
                  {event.contactEmail || "Не указан"}
                </p>
                {event.website.trim() && (
                  <a
                    href={event.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block break-all text-xs text-primary hover:underline">
                    {event.website}
                  </a>
                )}
              </article>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-2xl font-bold text-foreground">
                Об организаторе
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-lg font-medium text-foreground">
                  {organizerInfo?.organizationName || "Организатор"}
                  {organizerInfo?.shortName ? ` (${organizerInfo.shortName})` : ""}
                </p>
                <p className="text-muted-foreground">
                  {organizerInfo?.description ||
                    "Описание организатора не указано."}
                </p>
                <p>
                  <span className="font-medium text-foreground">Email:</span>{" "}
                  <span className="break-all text-muted-foreground">
                    {organizerInfo?.contactEmail || event.contactEmail || "Не указан"}
                  </span>
                </p>
                {organizerInfo?.contactPhone && (
                  <p>
                    <span className="font-medium text-foreground">Телефон:</span>{" "}
                    <span className="text-muted-foreground">
                      {organizerInfo.contactPhone}
                    </span>
                  </p>
                )}
                {(organizerInfo?.website || event.website) && (
                  <p>
                    <span className="font-medium text-foreground">Сайт:</span>{" "}
                    <a
                      className="break-all text-primary hover:underline"
                      href={organizerInfo?.website || event.website}
                      target="_blank"
                      rel="noreferrer">
                      {organizerInfo?.website || event.website}
                    </a>
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h3 className="text-xl font-bold text-foreground">
                Регистрация на мероприятие
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Нажмите кнопку ниже, чтобы перейти к записи.
              </p>

              <button
                type="button"
                onClick={handleRegisterClick}
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-95">
                Зарегистрироваться
              </button>

              {message && (
                <p className="mt-3 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground">
                  {message}
                </p>
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-xl font-bold text-foreground">QR-код</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Сканируйте код или скопируйте ссылку на публичную страницу.
            </p>

            <div className="mt-5 flex flex-col items-center gap-5">
              <div className="rounded-2xl border border-border bg-background p-4">
                {resolvedQrCodeUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolvedQrCodeUrl}
                    alt="QR-код мероприятия"
                    className="h-40 w-40 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    <QrCode className="h-8 w-8" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary">
                <Link2 className="h-4 w-4" />
                Скопировать ссылку
              </button>
            </div>
          </section>
        </section>
      </div>

      <PublicEventAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        eventId={eventId}
        onStudentAuthSuccess={handleStudentAuthSuccess}
      />
    </main>
  );
}
