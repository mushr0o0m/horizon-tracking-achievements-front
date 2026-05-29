"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { SubscribersPage } from "@/components/shared/subscribers-page";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

interface HrCandidateSubscribersListPageProps {
  candidateName?: string | null;
  subscribers?: SubscriberPreviewItem[];
  onBack?: () => void;
  onOpenSubscriber?: (hrId: string) => void;
}

export function HrCandidateSubscribersListPageContent({
  candidateName,
  subscribers,
  onBack,
  onOpenSubscriber,
}: HrCandidateSubscribersListPageProps) {
  if (!subscribers || !onBack || !onOpenSubscriber) {
    return <AppShellCommon />;
  }

  return (
    <SubscribersPage
      title={candidateName ? `Подписчики: ${candidateName}` : "Подписчики кандидата"}
      subtitle="HR, которые следят за обновлениями этого кандидата"
      subscribers={subscribers}
      onBack={onBack}
      onOpenSubscriber={onOpenSubscriber}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
