"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { VerificationRequestsPage } from "@/components/organizer/verification-requests-page";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrganizerVerificationRequestsPage } from "@/hooks/use-organizer-verification-requests-page";

interface OrganizerVerificationRequestsPageProps {
  userId?: string;
}

export function OrganizerVerificationRequestsPageContent({
  userId,
}: OrganizerVerificationRequestsPageProps) {
  const { requests, isLoading, handleReviewRequest } =
    useOrganizerVerificationRequestsPage(userId ?? "", Boolean(userId));

  if (!userId) {
    return <AppShellCommon />;
  }

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            Запросы на подтверждение
          </h2>
          <p className="text-muted-foreground">
            Подтвердите достижение обучающегося или отклоните запрос
          </p>
        </section>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  return (
    <VerificationRequestsPage
      requests={requests}
      onApprove={(achievementId, comment) => {
        void handleReviewRequest(achievementId, "Подтверждено", comment);
      }}
      onReject={(achievementId, comment) => {
        void handleReviewRequest(achievementId, "Отклонено", comment);
      }}
      />
    );
}

export default function Page() {
  return <AppShellCommon />;
}
