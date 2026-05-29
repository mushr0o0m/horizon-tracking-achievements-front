"use client";

import { ProfilePage } from "@/components/student/profile-page";
import type { Dispatch, SetStateAction } from "react";
import type { Achievement, AuthUser } from "@/lib/types";
import type { BadgeViewModel } from "@/lib/badges";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import type { StudentProfileTab } from "@/components/student/profile-page";

interface StudentProfileSectionProps {
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
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
  onDeleteAccount: (confirmationText: string) => string | null;
  activeTab: StudentProfileTab;
  onTabChange: (tab: StudentProfileTab) => void;
}

export function StudentProfileSection({
  user,
  achievements,
  badges,
  subscribers,
  publicStats,
  onOpenSubscribers,
  setCurrentUser,
  onChangePassword,
  onDeleteAccount,
  activeTab,
  onTabChange,
}: StudentProfileSectionProps) {
  return (
    <ProfilePage
      user={user}
      achievements={achievements}
      badges={badges}
      subscribers={subscribers}
      onOpenSubscribers={onOpenSubscribers}
      setCurrentUser={setCurrentUser}
      publicStats={publicStats}
      onChangePassword={onChangePassword}
      onDeleteAccount={onDeleteAccount}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}
