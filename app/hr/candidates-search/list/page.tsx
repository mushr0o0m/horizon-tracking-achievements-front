"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { HrCandidatesSearchPage, type HrCandidateSummary, type HrCandidatesSearchFiltersState } from "@/components/hr/hr-candidates-search-page";

interface HrCandidatesSearchListPageProps {
  candidates?: HrCandidateSummary[];
  filtersState?: HrCandidatesSearchFiltersState;
  onFiltersStateChange?: (nextState: HrCandidatesSearchFiltersState) => void;
  onAddToFunnel?: (candidateId: string) => string | null | Promise<string | null>;
  onOpenCandidate?: (candidateId: string) => void;
  isLoading?: boolean;
}

export function HrCandidatesSearchListPageContent({
  candidates,
  filtersState,
  onFiltersStateChange,
  onAddToFunnel,
  onOpenCandidate,
  isLoading,
}: HrCandidatesSearchListPageProps) {
  if (!candidates || !filtersState || !onFiltersStateChange || !onAddToFunnel || !onOpenCandidate) {
    return <AppShellCommon />;
  }

  return (
    <HrCandidatesSearchPage
      candidates={candidates}
      filtersState={filtersState}
      onFiltersStateChange={onFiltersStateChange}
      onAddToFunnel={onAddToFunnel}
      onOpenCandidate={onOpenCandidate}
      isLoading={isLoading}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
