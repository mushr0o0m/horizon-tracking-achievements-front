import { useEffect, useMemo, useState } from "react";
import {
  FunnelData,
  QuickSearchRow,
} from "@/components/hr/dashboards/types";
import { KANBAN_STATUSES } from "@/components/hr/dashboards/constants";

export function useHrQuickSearch(funnelData: FunnelData) {
  const [searchQuery, setSearchQuery] = useState("");
  const [quickSearchPage, setQuickSearchPage] = useState(1);

  const quickSearchRows = useMemo<QuickSearchRow[]>(() => {
    const normalized = searchQuery.trim().toLowerCase();
    const all = KANBAN_STATUSES.flatMap((status) =>
      funnelData[status].map((candidate) => ({ ...candidate, status })),
    );

    if (!normalized) return all;

    return all.filter((item) =>
      `${item.name} ${item.university} ${item.faculty} ${item.course} ${item.status}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [funnelData, searchQuery]);

  const quickSearchPageSize = 12;
  const quickSearchPageCount = Math.max(
    1,
    Math.ceil(quickSearchRows.length / quickSearchPageSize),
  );
  const safeQuickSearchPage = Math.min(quickSearchPage, quickSearchPageCount);
  const paginatedQuickSearchRows = quickSearchRows.slice(
    (safeQuickSearchPage - 1) * quickSearchPageSize,
    safeQuickSearchPage * quickSearchPageSize,
  );

  useEffect(() => {
    setQuickSearchPage(1);
  }, [searchQuery, quickSearchRows.length]);

  return {
    searchQuery,
    setSearchQuery,
    quickSearchPage,
    setQuickSearchPage,
    quickSearchRows,
    quickSearchPageCount,
    safeQuickSearchPage,
    paginatedQuickSearchRows,
  };
}
