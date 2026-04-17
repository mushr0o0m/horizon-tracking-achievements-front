import { useCallback, useEffect, useState } from "react";
import {
  DashboardMetrics,
  FunnelData,
  ArchiveCandidate,
  StatusCounts,
  StatusUpdateWindow,
} from "@/components/hr-dashboards/types";
import { buildDashboardSnapshot } from "@/components/hr-dashboards/utils";

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

export function useHrDashboardData(
  statusUpdateWindowDays: StatusUpdateWindow,
  hrId?: string,
) {
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

  const syncDashboardData = useCallback(() => {
    const snapshot = buildDashboardSnapshot(statusUpdateWindowDays, hrId);
    setFunnelData(snapshot.funnelData);
    setArchiveCandidates(snapshot.archiveCandidates);
    setRecentActions(snapshot.recentActions);
    setMetrics(snapshot.metrics);
  }, [statusUpdateWindowDays, hrId]);

  useEffect(() => {
    syncDashboardData();

    const onStorage = () => syncDashboardData();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [syncDashboardData]);

  return {
    funnelData,
    archiveCandidates,
    recentActions,
    metrics,
    syncDashboardData,
  };
}
