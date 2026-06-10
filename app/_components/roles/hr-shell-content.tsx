"use client";

import { HrHomePageContent } from "@/app/hr/home/main/page";
import { HrDashboardsKanbanPageContent } from "@/app/hr/dashboards/kanban/page";
import { HrCandidatesSearchListPageContent } from "@/app/hr/candidates-search/list/page";
import { HrCandidateProfileMainPageContent } from "@/app/hr/candidate-profile/main/page";
import { HrCandidateSubscribersListPageContent } from "@/app/hr/candidate-subscribers/list/page";
import { HrSubscriberProfileViewPageContent } from "@/app/hr/subscriber-profile/view/page";
import { HrEventDetailsViewPageContent } from "@/app/hr/event-details/view/page";
import { HrProfileMainPageContent } from "@/app/hr/profile/main/page";
import {
  type HrShellRuntimeProps,
  useHrShellRuntime,
} from "@/app/_components/hr/use-hr-shell-runtime";

export function HrShellContent(props: HrShellRuntimeProps) {
  const runtime = useHrShellRuntime(props);

  return (
    <>
      {runtime.hrView === "home" && (
        <HrHomePageContent
          topByAchievements={runtime.hrTopByAchievements}
          topBySubscribers={runtime.hrTopBySubscribers}
          notifications={runtime.hrHomeNotifications}
          talentFeedComparison={runtime.hrTalentFeedComparison}
          activeTab={runtime.hrHomeTab}
          onTabChange={runtime.openHrHomeTab}
          newsFeedItems={runtime.hrNewsFeedItems}
          newsFeedEmptyMessage={runtime.hrNewsFeedEmptyMessage}
          newsFeedError={runtime.hrNewsFeedError}
          newsFeedHasMore={runtime.hrNewsFeedHasMore}
          isNewsFeedLoadingInitial={runtime.hrNewsFeedIsLoadingInitial}
          isNewsFeedLoadingMore={runtime.hrNewsFeedIsLoadingMore}
          onLoadMoreNewsFeed={runtime.loadMoreHrNewsFeed}
          onMarkNewsViewed={runtime.markViewedHrNews}
          onAddNewsCandidateToFunnel={runtime.addHrCandidateToFunnel}
          recommendationsItems={runtime.hrRecommendationsItems}
          recommendationsEmptyMessage={runtime.hrRecommendationsEmptyMessage}
          recommendationsError={runtime.hrRecommendationsError}
          recommendationsHasMore={runtime.hrRecommendationsHasMore}
          isRecommendationsLoadingInitial={
            runtime.hrRecommendationsIsLoadingInitial
          }
          isRecommendationsLoadingMore={runtime.hrRecommendationsIsLoadingMore}
          recommendationsFilter={runtime.hrRecommendationsFilter}
          onRecommendationsFilterChange={runtime.setHrRecommendationsFilter}
          onLoadMoreRecommendations={runtime.loadMoreHrRecommendations}
          onMarkRecommendationsViewed={runtime.markViewedHrRecommendations}
          onToggleRecommendationSubscription={
            runtime.toggleHrRecommendationSubscription
          }
          onAddRecommendationCandidateToFunnel={runtime.addHrCandidateToFunnel}
          onOpenCandidate={runtime.openHrCandidateFromHome}
          onMarkNotificationRead={runtime.handleMarkNotificationRead}
          onMarkAllNotificationsRead={runtime.handleMarkAllNotificationsRead}
        />
      )}

      {runtime.hrView === "dashboards" && (
        <HrDashboardsKanbanPageContent
          hrId={runtime.currentUser.id}
          activeTab={runtime.hrDashboardTab}
          defaultInviteComment={runtime.hrDefaultInviteComment}
          actionConfirmSettings={runtime.hrActionConfirmSettings}
          onSaveCandidateNote={runtime.saveHrCandidateNote}
          onOpenCandidate={runtime.openHrCandidateFromDashboards}
          onChangeCandidateStatus={(candidateId, toStatus, fromStatus) =>
            runtime.moveHrCandidateStatus(
              candidateId,
              toStatus,
              "Статус изменен на дашборде",
              fromStatus,
            )
          }
          onInviteCandidate={(candidateId, payload, fromStatus) =>
            runtime.inviteHrCandidate(candidateId, payload, fromStatus)
          }
          onArchiveCandidate={runtime.archiveHrCandidate}
          onTabChange={runtime.openHrDashboardsTab}
        />
      )}

      {runtime.hrView === "candidates-search" && (
        <HrCandidatesSearchListPageContent
          candidates={runtime.hrCandidates}
          isLoading={runtime.isHrCandidatesSearchLoading}
          filtersState={runtime.hrCandidatesSearchFilters}
          onFiltersStateChange={runtime.setHrCandidatesSearchFilters}
          onAddToFunnel={runtime.addHrCandidateToFunnel}
          onOpenCandidate={runtime.openHrCandidateFromSearch}
        />
      )}

      {runtime.hrView === "candidate-profile" && (
        <HrCandidateProfileMainPageContent
          candidate={runtime.selectedHrCandidate}
          achievements={runtime.selectedHrCandidateAchievements}
          events={runtime.selectedHrCandidateEvents}
          candidateStatus={runtime.selectedHrCandidateStatus}
          statusHistory={runtime.selectedHrCandidateStatusHistory}
          savedNote={runtime.selectedHrCandidateNote}
          defaultInviteComment={runtime.hrDefaultInviteComment}
          subscribers={runtime.selectedHrCandidateSubscribers}
          isCurrentHrSubscribed={runtime.isSelectedCandidateSubscribedByCurrentHr}
          onBackToPreviousPage={runtime.closeHrCandidateProfile}
          onOpenEvent={runtime.openHrEvent}
          onSaveNote={runtime.saveHrCandidateNote}
          onInvite={(payload) =>
            runtime.selectedHrCandidate
              ? runtime.inviteHrCandidate(runtime.selectedHrCandidate.id, payload)
              : "Кандидат не выбран."
          }
          onToggleSubscription={runtime.toggleHrCandidateSubscription}
          isLoading={runtime.isHrCandidateProfileLoading}
          onOpenSubscribers={runtime.openCandidateSubscribers}
          onAddToFunnel={() =>
            runtime.selectedHrCandidate
              ? runtime.addHrCandidateToFunnel(runtime.selectedHrCandidate.id)
              : null
          }
        />
      )}

      {runtime.hrView === "candidate-subscribers" && (
        <HrCandidateSubscribersListPageContent
          candidateName={runtime.selectedHrCandidate?.name ?? null}
          subscribers={runtime.selectedHrCandidateSubscribers}
          onBack={runtime.backToCandidateProfile}
          onOpenSubscriber={runtime.openSubscriberProfile}
        />
      )}

      {runtime.hrView === "subscriber-profile" && (
        <HrSubscriberProfileViewPageContent
          hrUser={runtime.selectedHrProfileUser}
          onBack={runtime.backFromSubscriberProfile}
        />
      )}

      {runtime.hrView === "event-details" && runtime.selectedEvent && (
        <HrEventDetailsViewPageContent
          event={runtime.selectedEvent}
          organizerInfo={runtime.eventOrganizerInfo}
          applications={runtime.selectedEventApplications}
          onBack={runtime.backFromEventDetails}
        />
      )}

      {runtime.hrView === "profile" && (
        <HrProfileMainPageContent
          user={runtime.currentUser}
          organizationStats={runtime.organizerComputedStats}
          setCurrentUser={runtime.setCurrentUser}
          onChangePassword={runtime.handleChangePassword}
          hrDefaultInviteComment={runtime.hrDefaultInviteComment}
          hrActionConfirmSettings={runtime.hrActionConfirmSettings}
          onUpdateHrDefaultInviteComment={runtime.updateHrDefaultInviteComment}
          onUpdateHrActionConfirmSettings={runtime.updateHrActionConfirmSettings}
          onDeleteAccount={runtime.handleDeleteAccount}
          activeTab={runtime.hrProfileTab}
          onTabChange={runtime.openHrProfileTab}
        />
      )}
    </>
  );
}
