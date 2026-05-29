"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { OrganizerProfilePage } from "@/components/organizer/organizer-profile-page";
import type { Dispatch, SetStateAction } from "react";
import type { AuthUser } from "@/lib/types";
import type { HrActionConfirmSettings } from "@/lib/hr-network";
import type { HrProfileTab } from "@/app/shared/routing/app-shell-routes";

interface HrProfileMainPageProps {
  user?: AuthUser;
  organizationStats?: {
    eventsCount: number;
    totalParticipants: number;
  };
  setCurrentUser?: Dispatch<SetStateAction<AuthUser | null>>;
  onChangePassword?: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<string | null>;
  hrDefaultInviteComment?: string;
  hrActionConfirmSettings?: HrActionConfirmSettings;
  onUpdateHrDefaultInviteComment?: (comment: string) => void;
  onUpdateHrActionConfirmSettings?: (settings: HrActionConfirmSettings) => void;
  onDeleteAccount?: (confirmationText: string) => string | null;
  activeTab?: HrProfileTab;
  onTabChange?: (tab: HrProfileTab) => void;
}

export function HrProfileMainPageContent({
  user,
  organizationStats,
  setCurrentUser,
  onChangePassword,
  hrDefaultInviteComment,
  hrActionConfirmSettings,
  onUpdateHrDefaultInviteComment,
  onUpdateHrActionConfirmSettings,
  onDeleteAccount,
  activeTab,
  onTabChange,
}: HrProfileMainPageProps) {
  if (
    !user ||
    !organizationStats ||
    !setCurrentUser ||
    !onChangePassword ||
    hrDefaultInviteComment === undefined ||
    !hrActionConfirmSettings ||
    !onUpdateHrDefaultInviteComment ||
    !onUpdateHrActionConfirmSettings ||
    !onDeleteAccount
  ) {
    return <AppShellCommon />;
  }

  return (
    <OrganizerProfilePage
      user={user}
      organizationStats={organizationStats}
      setCurrentUser={setCurrentUser}
      onChangePassword={onChangePassword}
      hrDefaultInviteComment={hrDefaultInviteComment}
      hrActionConfirmSettings={hrActionConfirmSettings}
      onUpdateHrDefaultInviteComment={onUpdateHrDefaultInviteComment}
      onUpdateHrActionConfirmSettings={onUpdateHrActionConfirmSettings}
      onDeleteAccount={onDeleteAccount}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
