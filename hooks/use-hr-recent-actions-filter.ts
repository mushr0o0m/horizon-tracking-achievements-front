import { useMemo, useState } from "react";
import {
  RecentActionType,
  StatusUpdateWindow,
} from "@/components/hr-dashboards/types";
import {
  getRecentActionType,
  isRecentActionWithinWindow,
} from "@/components/hr-dashboards/utils";

export function useHrRecentActionsFilter(
  recentActions: string[],
  statusUpdateWindowDays: StatusUpdateWindow,
) {
  const [recentActionsFilter, setRecentActionsFilter] =
    useState<RecentActionType>("all");
  const [recentActionsQuery, setRecentActionsQuery] = useState("");

  const filteredRecentActions = useMemo(() => {
    const normalizedQuery = recentActionsQuery.trim().toLowerCase();

    return recentActions.filter((action) => {
      const actionType = getRecentActionType(action);
      const byType =
        recentActionsFilter === "all" || recentActionsFilter === actionType;
      const byWindow = isRecentActionWithinWindow(
        action,
        statusUpdateWindowDays,
      );
      const byText =
        normalizedQuery.length === 0 ||
        action.toLowerCase().includes(normalizedQuery);

      return byType && byWindow && byText;
    });
  }, [
    recentActions,
    recentActionsFilter,
    recentActionsQuery,
    statusUpdateWindowDays,
  ]);

  return {
    recentActionsFilter,
    setRecentActionsFilter,
    recentActionsQuery,
    setRecentActionsQuery,
    filteredRecentActions,
  };
}
