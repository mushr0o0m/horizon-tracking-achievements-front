import { useCallback, useEffect, useState } from "react";
import {
  DashboardMetrics,
  FunnelData,
  ArchiveCandidate,
  StatusCounts,
  StatusUpdateWindow,
} from "@/components/hr/dashboards/types";
import {
  fetchHrArchive,
  fetchHrDashboard,
  fetchHrRecentActions,
} from "@/lib/backend-api";

function buildEmptyFunnelData(): FunnelData {
  return {
    "На рассмотрении": [],
    Интересует: [],
    Приглашён: [],
    "Ответили на приглашение": [],
    Отклонён: [],
  };
}

function buildEmptyStatusCounts(): StatusCounts {
  return {
    "На рассмотрении": 0,
    Интересует: 0,
    Приглашён: 0,
    "Ответили на приглашение": 0,
    Отклонён: 0,
  };
}

export function useHrDashboardData(statusUpdateWindowDays: StatusUpdateWindow) {
  const [funnelData, setFunnelData] =
    useState<FunnelData>(buildEmptyFunnelData);
  const [archiveCandidates, setArchiveCandidates] = useState<
    ArchiveCandidate[]
  >([]);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    inFunnelCount: 0,
    activeCount: 0,
    confirmedAchievementsCount: 0,
    byStatus: buildEmptyStatusCounts(),
  });

  const syncDashboardData = useCallback(async () => {
    try {
      const [dashboard, archive, recent] = await Promise.all([
        fetchHrDashboard(statusUpdateWindowDays),
        fetchHrArchive(statusUpdateWindowDays),
        fetchHrRecentActions({ days: statusUpdateWindowDays }),
      ]);
      setFunnelData(dashboard.funnelData);
      setArchiveCandidates(archive);
      setRecentActions(recent);
      setMetrics(dashboard.metrics);
    } catch (error) {
      console.warn("Failed to load HR dashboard data.", error);
      setFunnelData(buildEmptyFunnelData());
      setArchiveCandidates([]);
      setRecentActions([]);
      setMetrics({
        inFunnelCount: 0,
        activeCount: 0,
        confirmedAchievementsCount: 0,
        byStatus: buildEmptyStatusCounts(),
      });
    }
  }, [statusUpdateWindowDays]);

  useEffect(() => {
    void syncDashboardData();
  }, [syncDashboardData]);

  return {
    funnelData,
    archiveCandidates,
    recentActions,
    metrics,
    syncDashboardData,
  };
}
