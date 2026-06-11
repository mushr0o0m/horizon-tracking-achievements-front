"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { HrProfileMainPageContent } from "@/app/hr/profile/main/page";
import type { AuthUser } from "@/lib/types";
import type { Dispatch, SetStateAction } from "react";
import type { HrActionConfirmSettings } from "@/lib/hr-network";
import type { HrProfileTab } from "@/app/shared/routing/app-shell-routes";

interface HrProfileMainTabPageProps {
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
  onLogout?: () => void;
  activeTab?: HrProfileTab;
  onTabChange?: (tab: HrProfileTab) => void;
}

export function HrProfileMainTabPageContent({
  user,
  organizationStats,
  setCurrentUser,
  onChangePassword,
  hrDefaultInviteComment,
  hrActionConfirmSettings,
  onUpdateHrDefaultInviteComment,
  onUpdateHrActionConfirmSettings,
  onLogout,
  activeTab,
  onTabChange,
}: HrProfileMainTabPageProps) {
  if (
    !user ||
    !organizationStats ||
    !setCurrentUser ||
    !onChangePassword ||
    hrDefaultInviteComment === undefined ||
    !hrActionConfirmSettings ||
    !onUpdateHrDefaultInviteComment ||
    !onUpdateHrActionConfirmSettings ||
    !onLogout
  ) {
    return <AppShellCommon />;
  }

  return (
    <HrProfileMainPageContent
      user={user}
      organizationStats={organizationStats}
      setCurrentUser={setCurrentUser}
      onChangePassword={onChangePassword}
      hrDefaultInviteComment={hrDefaultInviteComment}
      hrActionConfirmSettings={hrActionConfirmSettings}
      onUpdateHrDefaultInviteComment={onUpdateHrDefaultInviteComment}
      onUpdateHrActionConfirmSettings={onUpdateHrActionConfirmSettings}
      onLogout={onLogout}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
