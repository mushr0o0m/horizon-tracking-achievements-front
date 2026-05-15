import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CircleHelp } from "lucide-react";
import { StatusWindowSelect } from "@/components/hr/dashboards/status-window-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArchiveCandidate,
  StatusUpdateWindow,
} from "@/components/hr/dashboards/types";

function formatDate(value: string): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Дата не указана";
  return new Date(timestamp).toLocaleDateString("ru-RU");
}

interface HrArchiveTabProps {
  archiveCandidates: ArchiveCandidate[];
  statusUpdateWindowDays: StatusUpdateWindow;
  onStatusUpdateWindowDaysChange: (value: StatusUpdateWindow) => void;
  onOpenCandidate: (candidateId: string) => void;
}

export function HrArchiveTab({
  archiveCandidates,
  statusUpdateWindowDays,
  onStatusUpdateWindowDaysChange,
  onOpenCandidate,
}: HrArchiveTabProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="inline-flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex cursor-help items-center gap-1.5 text-left text-lg font-semibold text-foreground">
                  Архив кандидатов
                  <CircleHelp className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                В архив попадают кандидаты без ответа 30+ дней, а также
                кандидаты, добавленные вручную.
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <StatusWindowSelect
            value={statusUpdateWindowDays}
            onChange={onStatusUpdateWindowDaysChange}
          />
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-5.5rem)] overflow-auto p-3">
        <div className="space-y-3">
          {archiveCandidates.map((candidate) => (
            <article key={candidate.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => onOpenCandidate(candidate.id)}
                    className="cursor-pointer font-semibold text-foreground hover:text-primary">
                    {candidate.name}
                  </button>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {candidate.university}, {candidate.faculty}, {candidate.course}
                  </p>
                </div>
                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                  {candidate.archiveSource === "manual"
                    ? "Добавлен вручную"
                    : `${candidate.staleDays ?? 0} дн. без ответа`}
                </span>
              </div>
              {candidate.archiveSource === "manual" ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Архивирован: {formatDate(candidate.archivedAt)}
                  {candidate.archiveReason ? ` · ${candidate.archiveReason}` : ""}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Приглашение отправлено: {formatDate(candidate.invitationCreatedAt ?? "")}
                </p>
              )}
            </article>
          ))}

          {archiveCandidates.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Сейчас нет кандидатов для архива
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
