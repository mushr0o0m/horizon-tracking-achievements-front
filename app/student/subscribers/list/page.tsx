"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentSubscribersSection } from "@/app/student/subscribers/list/section";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

interface StudentSubscribersPageContentProps {
  subscribers: SubscriberPreviewItem[];
  onBack: () => void;
  onOpenSubscriber: (hrId: string) => void;
}

export function StudentSubscribersPageContent({
  subscribers,
  onBack,
  onOpenSubscriber,
}: StudentSubscribersPageContentProps) {
  return (
    <StudentSubscribersSection
      subscribers={subscribers}
      onBack={onBack}
      onOpenSubscriber={onOpenSubscriber}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
