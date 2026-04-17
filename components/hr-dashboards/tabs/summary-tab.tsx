import {
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Trophy,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusWindowSelect } from "@/components/hr-dashboards/status-window-select";
import { COLUMN_THEME, KANBAN_STATUSES } from "@/components/hr-dashboards/constants";
import {
  DashboardMetrics,
  StatusUpdateWindow,
} from "@/components/hr-dashboards/types";

interface HrSummaryTabProps {
  metrics: DashboardMetrics;
  publishedEventsCount: number;
  statusUpdateWindowDays: StatusUpdateWindow;
  onStatusUpdateWindowDaysChange: (value: StatusUpdateWindow) => void;
}

export function HrSummaryTab({
  metrics,
  publishedEventsCount,
  statusUpdateWindowDays,
  onStatusUpdateWindowDaysChange,
}: HrSummaryTabProps) {
  return (
    <div className="h-full overflow-auto pr-1">
      <div className="mb-4 flex justify-end">
        <StatusWindowSelect
          value={statusUpdateWindowDays}
          onChange={onStatusUpdateWindowDaysChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Всего в воронке</CardDescription>
            <GraduationCap className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{metrics.inFunnelCount}</CardTitle>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Активные кандидаты</CardDescription>
            <BriefcaseBusiness className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{metrics.activeCount}</CardTitle>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Подтвержденные достижения</CardDescription>
            <Trophy className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{metrics.confirmedAchievementsCount}</CardTitle>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardDescription>Опубликованные мероприятия</CardDescription>
            <CalendarDays className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <CardTitle className="text-3xl">{publishedEventsCount}</CardTitle>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {KANBAN_STATUSES.map((status) => (
          <Card
            key={status}
            className={`border border-border ${COLUMN_THEME[status].surface}`}>
            <CardHeader className="pb-3">
              <CardDescription>{status}</CardDescription>
              <CardTitle className="text-3xl">{metrics.byStatus[status]}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
