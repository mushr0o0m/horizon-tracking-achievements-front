"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentProfileSection } from "@/app/student/profile/main/section";
import type { BadgeViewModel } from "@/lib/badges";
import type { Dispatch, SetStateAction } from "react";
import type { Achievement, AuthUser } from "@/lib/types";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

interface StudentProfilePageContentProps {
  user: AuthUser;
  achievements: Achievement[];
  badges: BadgeViewModel[];
  subscribers: SubscriberPreviewItem[];
  publicStats: {
    achievementsCount: number;
    activityIndex: number;
    percentile: number;
  };
  onOpenSubscribers: () => void;
  setCurrentUser: Dispatch<SetStateAction<AuthUser | null>>;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<string | null>;
  onDeleteAccount: (confirmationText: string) => string | null;
}

export function StudentProfilePageContent({
  user,
  achievements,
  badges,
  subscribers,
  publicStats,
  onOpenSubscribers,
  setCurrentUser,
  onChangePassword,
  onDeleteAccount,
}: StudentProfilePageContentProps) {
  return (
    <StudentProfileSection
      user={user}
      achievements={achievements}
      badges={badges}
      subscribers={subscribers}
      publicStats={publicStats}
      onOpenSubscribers={onOpenSubscribers}
      setCurrentUser={setCurrentUser}
      onChangePassword={onChangePassword}
      onDeleteAccount={onDeleteAccount}
    />
  );
}

export default function Page() {
  return <AppShellCommon />;
}
