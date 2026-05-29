"use client";

import { StudentSubscribersSection } from "@/app/student/subscribers/list/section";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";

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
  const runtime = useStudentPageRuntime();
  return (
    <StudentSubscribersPageContent
      subscribers={runtime.studentSubscribers}
      onBack={runtime.backFromSubscribers}
      onOpenSubscriber={runtime.openSubscriberProfile}
    />
  );
}
