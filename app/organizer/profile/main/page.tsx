"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { OrganizerProfilePage } from "@/components/organizer/organizer-profile-page";
import type { Dispatch, SetStateAction } from "react";
import type { AuthUser } from "@/lib/types";

interface OrganizerProfileMainPageProps {
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
  onDeleteAccount?: (confirmationText: string) => string | null;
}

export function OrganizerProfileMainPageContent({
  user,
  organizationStats,
  setCurrentUser,
  onChangePassword,
  onDeleteAccount,
}: OrganizerProfileMainPageProps) {
  if (!user || !organizationStats || !setCurrentUser || !onChangePassword || !onDeleteAccount) {
    return <AppShellCommon />;
  }

  return (
    <OrganizerProfilePage
      user={user}
      organizationStats={organizationStats}
      setCurrentUser={setCurrentUser}
      onChangePassword={onChangePassword}
      onDeleteAccount={onDeleteAccount}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
