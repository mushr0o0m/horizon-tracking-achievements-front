import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusWindowSelect } from "@/components/hr/dashboards/status-window-select";
import {
  RECENT_ACTION_FILTERS,
} from "@/components/hr/dashboards/constants";
import {
  RecentActionType,
  StatusUpdateWindow,
} from "@/components/hr/dashboards/types";

interface HrRecentActionsTabProps {
  statusUpdateWindowDays: StatusUpdateWindow;
  onStatusUpdateWindowDaysChange: (value: StatusUpdateWindow) => void;
  recentActionsFilter: RecentActionType;
  onRecentActionsFilterChange: (value: RecentActionType) => void;
  recentActionsQuery: string;
  onRecentActionsQueryChange: (value: string) => void;
  filteredRecentActions: string[];
}

export function HrRecentActionsTab({
  statusUpdateWindowDays,
  onStatusUpdateWindowDaysChange,
  recentActionsFilter,
  onRecentActionsFilterChange,
  recentActionsQuery,
  onRecentActionsQueryChange,
  filteredRecentActions,
}: HrRecentActionsTabProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span>Тип действия</span>
          <select
            value={recentActionsFilter}
            onChange={(event) =>
              onRecentActionsFilterChange(event.target.value as RecentActionType)
            }
            className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            {RECENT_ACTION_FILTERS.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </label>

        <StatusWindowSelect
          value={statusUpdateWindowDays}
          onChange={onStatusUpdateWindowDaysChange}
        />

        <div className="relative ml-auto w-full md:max-w-[420px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recentActionsQuery}
            onChange={(event) => onRecentActionsQueryChange(event.target.value)}
            placeholder="Поиск по тексту действия"
            className="pl-9"
          />
        </div>
      </div>

      <Card className="min-h-0 flex-1">
        <CardContent className="h-full overflow-auto p-3">
          <div className="space-y-3">
            {filteredRecentActions.length > 0 ? (
              filteredRecentActions.map((action, index) => (
                <div key={index} className="rounded-lg border border-border p-3 text-sm">
                  {action}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                По выбранным фильтрам действий пока нет
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
