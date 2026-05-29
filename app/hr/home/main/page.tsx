"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { HrHomePage, type HrHomeTopAchievementCandidate, type HrHomeTopSubscriberCandidate, type HrTalentFeedComparison } from "@/components/hr/hr-home-page";
import type { AppNotification } from "@/lib/types";

interface HrHomeMainPageProps {
  topByAchievements?: HrHomeTopAchievementCandidate[];
  topBySubscribers?: HrHomeTopSubscriberCandidate[];
  notifications?: AppNotification[];
  talentFeedComparison?: HrTalentFeedComparison | null;
  onOpenCandidate?: (candidateId: string) => void;
  onMarkNotificationRead?: (notificationId: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export function HrHomePageContent({
  topByAchievements,
  topBySubscribers,
  notifications,
  talentFeedComparison,
  onOpenCandidate,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: HrHomeMainPageProps) {
  if (
    !topByAchievements ||
    !topBySubscribers ||
    !notifications ||
    !onOpenCandidate ||
    !onMarkNotificationRead ||
    !onMarkAllNotificationsRead
  ) {
    return <AppShellCommon />;
  }

  return (
    <HrHomePage
      topByAchievements={topByAchievements}
      topBySubscribers={topBySubscribers}
      notifications={notifications}
      talentFeedComparison={talentFeedComparison}
      onOpenCandidate={onOpenCandidate}
      onMarkNotificationRead={onMarkNotificationRead}
      onMarkAllNotificationsRead={onMarkAllNotificationsRead}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
