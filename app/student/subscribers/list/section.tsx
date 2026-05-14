"use client";

import { SubscribersPage } from "@/components/shared/subscribers-page";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

interface StudentSubscribersSectionProps {
  subscribers: SubscriberPreviewItem[];
  onBack: () => void;
  onOpenSubscriber: (hrId: string) => void;
}

export function StudentSubscribersSection({
  subscribers,
  onBack,
  onOpenSubscriber,
}: StudentSubscribersSectionProps) {
  return (
    <SubscribersPage
      title="Мои подписчики"
      subtitle="HR, которые следят за вашим профилем"
      subscribers={subscribers}
      onBack={onBack}
      onOpenSubscriber={onOpenSubscriber}
    />
  );
}
