"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import {
  HrHomePage,
  type HrHomeTopAchievementCandidate,
  type HrHomeTopSubscriberCandidate,
  type HrTalentFeedComparison,
} from "@/components/hr/hr-home-page";
import type {
  HrFeedNewsItem,
  HrFeedRecommendationsItem,
  HrRecommendationsFilter,
} from "@/lib/backend-api";
import type { HrHomeTab } from "@/app/shared/routing/app-shell-routes";
import type { AppNotification } from "@/lib/types";

interface HrHomeMainPageProps {
  topByAchievements?: HrHomeTopAchievementCandidate[];
  topBySubscribers?: HrHomeTopSubscriberCandidate[];
  notifications?: AppNotification[];
  talentFeedComparison?: HrTalentFeedComparison | null;
  activeTab?: HrHomeTab;
  onTabChange?: (tab: HrHomeTab) => void;
  newsFeedItems?: HrFeedNewsItem[];
  newsFeedEmptyMessage?: string | null;
  newsFeedError?: string | null;
  newsFeedHasMore?: boolean;
  isNewsFeedLoadingInitial?: boolean;
  isNewsFeedLoadingMore?: boolean;
  onLoadMoreNewsFeed?: () => void;
  onMarkNewsViewed?: (newsIds: string[]) => void;
  onAddNewsCandidateToFunnel?: (
    candidateId: string,
  ) => string | null | Promise<string | null>;
  recommendationsItems?: HrFeedRecommendationsItem[];
  recommendationsEmptyMessage?: string | null;
  recommendationsError?: string | null;
  recommendationsHasMore?: boolean;
  isRecommendationsLoadingInitial?: boolean;
  isRecommendationsLoadingMore?: boolean;
  recommendationsFilter?: HrRecommendationsFilter;
  onRecommendationsFilterChange?: (filter: HrRecommendationsFilter) => void;
  onLoadMoreRecommendations?: () => void;
  onMarkRecommendationsViewed?: (candidateIds: string[]) => void;
  onToggleRecommendationSubscription?: (
    candidateId: string,
  ) => string | null | Promise<string | null>;
  onAddRecommendationCandidateToFunnel?: (
    candidateId: string,
  ) => string | null | Promise<string | null>;
  onOpenCandidate?: (candidateId: string) => void;
  onMarkNotificationRead?: (notificationId: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export function HrHomePageContent({
  topByAchievements,
  topBySubscribers,
  notifications,
  talentFeedComparison,
  activeTab,
  onTabChange,
  newsFeedItems,
  newsFeedEmptyMessage,
  newsFeedError,
  newsFeedHasMore,
  isNewsFeedLoadingInitial,
  isNewsFeedLoadingMore,
  onLoadMoreNewsFeed,
  onMarkNewsViewed,
  onAddNewsCandidateToFunnel,
  recommendationsItems,
  recommendationsEmptyMessage,
  recommendationsError,
  recommendationsHasMore,
  isRecommendationsLoadingInitial,
  isRecommendationsLoadingMore,
  recommendationsFilter,
  onRecommendationsFilterChange,
  onLoadMoreRecommendations,
  onMarkRecommendationsViewed,
  onToggleRecommendationSubscription,
  onAddRecommendationCandidateToFunnel,
  onOpenCandidate,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: HrHomeMainPageProps) {
  if (
    !topByAchievements ||
    !topBySubscribers ||
    !notifications ||
    !activeTab ||
    !onTabChange ||
    !newsFeedItems ||
    newsFeedHasMore === undefined ||
    isNewsFeedLoadingInitial === undefined ||
    isNewsFeedLoadingMore === undefined ||
    !onLoadMoreNewsFeed ||
    !onMarkNewsViewed ||
    !onAddNewsCandidateToFunnel ||
    !recommendationsItems ||
    recommendationsHasMore === undefined ||
    isRecommendationsLoadingInitial === undefined ||
    isRecommendationsLoadingMore === undefined ||
    !recommendationsFilter ||
    !onRecommendationsFilterChange ||
    !onLoadMoreRecommendations ||
    !onMarkRecommendationsViewed ||
    !onToggleRecommendationSubscription ||
    !onAddRecommendationCandidateToFunnel ||
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
      activeTab={activeTab}
      onTabChange={onTabChange}
      newsFeedItems={newsFeedItems}
      newsFeedEmptyMessage={newsFeedEmptyMessage}
      newsFeedError={newsFeedError}
      newsFeedHasMore={newsFeedHasMore}
      isNewsFeedLoadingInitial={isNewsFeedLoadingInitial}
      isNewsFeedLoadingMore={isNewsFeedLoadingMore}
      onLoadMoreNewsFeed={onLoadMoreNewsFeed}
      onMarkNewsViewed={onMarkNewsViewed}
      onAddNewsCandidateToFunnel={onAddNewsCandidateToFunnel}
      recommendationsItems={recommendationsItems}
      recommendationsEmptyMessage={recommendationsEmptyMessage}
      recommendationsError={recommendationsError}
      recommendationsHasMore={recommendationsHasMore}
      isRecommendationsLoadingInitial={isRecommendationsLoadingInitial}
      isRecommendationsLoadingMore={isRecommendationsLoadingMore}
      recommendationsFilter={recommendationsFilter}
      onRecommendationsFilterChange={onRecommendationsFilterChange}
      onLoadMoreRecommendations={onLoadMoreRecommendations}
      onMarkRecommendationsViewed={onMarkRecommendationsViewed}
      onToggleRecommendationSubscription={onToggleRecommendationSubscription}
      onAddRecommendationCandidateToFunnel={onAddRecommendationCandidateToFunnel}
      onOpenCandidate={onOpenCandidate}
      onMarkNotificationRead={onMarkNotificationRead}
      onMarkAllNotificationsRead={onMarkAllNotificationsRead}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
