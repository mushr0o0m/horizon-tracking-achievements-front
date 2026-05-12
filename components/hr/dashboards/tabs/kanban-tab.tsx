import { ArrowLeft, ArrowRight, ArrowUpRight, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  COLUMN_DESCRIPTIONS,
  COLUMN_THEME,
} from "@/components/hr/dashboards/constants";
import {
  FunnelCandidate,
  FunnelData,
  KanbanStatus,
  StatusUpdateWindow,
} from "@/components/hr/dashboards/types";
import { StatusWindowSelect } from "@/components/hr/dashboards/status-window-select";

interface HrKanbanTabProps {
  statusUpdateWindowDays: StatusUpdateWindow;
  onStatusUpdateWindowDaysChange: (value: StatusUpdateWindow) => void;
  visibleColumns: KanbanStatus[];
  columnStart: number;
  maxColumnStart: number;
  onPrevColumn: () => void;
  onNextColumn: () => void;
  funnelData: FunnelData;
  onOpenCandidateModal: (
    candidate: FunnelCandidate,
    status: KanbanStatus,
  ) => void;
  onOpenCandidateProfile: (candidateId: string) => void;
}

export function HrKanbanTab({
  statusUpdateWindowDays,
  onStatusUpdateWindowDaysChange,
  visibleColumns,
  columnStart,
  maxColumnStart,
  onPrevColumn,
  onNextColumn,
  funnelData,
  onOpenCandidateModal,
  onOpenCandidateProfile,
}: HrKanbanTabProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
        <StatusWindowSelect
          value={statusUpdateWindowDays}
          onChange={onStatusUpdateWindowDaysChange}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrevColumn}
            disabled={columnStart === 0}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextColumn}
            disabled={columnStart >= maxColumnStart}>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visibleColumns.map((status) => (
          <Card
            key={status}
            className={`min-h-0 overflow-hidden border ${COLUMN_THEME[status].border} ${COLUMN_THEME[status].gradient}`}>
            <CardHeader
              className={`rounded-t-xl px-4 py-3 ${COLUMN_THEME[status].header}`}>
              <div className="flex items-start justify-between gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-left text-base font-semibold underline decoration-dotted underline-offset-4">
                      {status}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {COLUMN_DESCRIPTIONS[status]}
                  </TooltipContent>
                </Tooltip>
                <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold text-foreground">
                  {funnelData[status].length}
                </span>
              </div>
            </CardHeader>

            <CardContent className="h-[calc(100%-5.25rem)] overflow-y-auto p-3">
              <div className="space-y-3">
                {funnelData[status].map((candidate) => (
                  <article
                    key={candidate.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenCandidateModal(candidate, status)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onOpenCandidateModal(candidate, status);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border bg-background px-3.5 py-3 shadow-sm transition hover:border-primary/50 hover:shadow-md ${candidate.hasNewAchievement ? "border-blue-400 shadow-md ring-1 ring-blue-200" : "border-border"}`}>
                    <div className="space-y-2.5">
                      <div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenCandidateProfile(candidate.id);
                          }}
                          className="inline-flex cursor-pointer items-center gap-1.5 text-left text-lg font-semibold leading-snug text-foreground hover:text-primary">
                          {candidate.hasNewAchievement && (
                            <span
                              aria-hidden
                              className="h-2.5 w-2.5 rounded-full bg-blue-500"
                            />
                          )}
                          {candidate.name}
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {candidate.university}, {candidate.faculty},{" "}
                          {candidate.course}
                        </p>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Достижения: {candidate.totalAchievements} / подтверждено{" "}
                        {candidate.confirmedAchievements}
                      </p>

                      {candidate.note.trim() && (
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          <NotebookPen className="w-3.5 h-3.5" />
                          Заметка
                        </div>
                      )}
                    </div>
                  </article>
                ))}

                {funnelData[status].length === 0 && (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    В колонке пока нет кандидатов
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
