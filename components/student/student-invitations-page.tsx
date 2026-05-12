"use client";

import { useMemo } from "react";
import { HrCandidateInvitation } from "@/lib/hr-network";
import { BriefcaseBusiness, CalendarDays, Check, X } from "lucide-react";

interface StudentInvitationsPageProps {
  invitations: HrCandidateInvitation[];
  onRespond: (
    invitationId: string,
    response: "accepted" | "rejected",
  ) => string | null;
}

const STATUS_STYLES: Record<HrCandidateInvitation["status"], string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_LABELS: Record<HrCandidateInvitation["status"], string> = {
  pending: "Ожидает ответа",
  accepted: "Принято",
  rejected: "Отклонено",
};

export function StudentInvitationsPage({
  invitations,
  onRespond,
}: StudentInvitationsPageProps) {
  const sortedInvitations = useMemo(
    () =>
      [...invitations].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [invitations],
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground">
          Приглашения от HR
        </h2>
        <p className="text-muted-foreground mt-1">
          Здесь можно принять или отклонить приглашения.
        </p>
      </section>

      {sortedInvitations.length > 0 ? (
        <div className="space-y-4">
          {sortedInvitations.map((invitation) => {
            const scheduleText = invitation.sendNow
              ? "Отправлено сразу"
              : invitation.scheduledAt
                ? `Запланировано на ${new Date(invitation.scheduledAt).toLocaleDateString("ru-RU")}`
                : "Запланировано";

            return (
              <div
                key={invitation.id}
                className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      HR: {invitation.hrName}
                    </p>
                    <p className="text-lg font-semibold text-foreground inline-flex items-center gap-2">
                      <BriefcaseBusiness className="w-4 h-4 text-primary" />
                      {invitation.position}
                    </p>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {scheduleText}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[invitation.status]}`}>
                    {STATUS_LABELS[invitation.status]}
                  </span>
                </div>

                {invitation.message && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {invitation.message}
                  </p>
                )}

                {invitation.status === "pending" ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onRespond(invitation.id, "accepted")}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700">
                      <Check className="w-4 h-4" />
                      Принять
                    </button>
                    <button
                      type="button"
                      onClick={() => onRespond(invitation.id, "rejected")}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary">
                      <X className="w-4 h-4" />
                      Отклонить
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground pt-1">
                    Ответ отправлен:{" "}
                    {new Date(
                      invitation.respondedAt ?? invitation.createdAt,
                    ).toLocaleString("ru-RU")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
          Пока нет приглашений
        </div>
      )}
    </div>
  );
}
