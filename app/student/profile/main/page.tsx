"use client";

import { StudentProfileSection } from "@/app/student/profile/main/section";
import type { BadgeViewModel } from "@/lib/badges";
import type { Dispatch, SetStateAction } from "react";
import type { Achievement, AuthUser } from "@/lib/types";
import type { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";
import type { StudentProfileTab } from "@/components/student/profile-page";

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
  activeTab: StudentProfileTab;
  onTabChange: (tab: StudentProfileTab) => void;
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
  activeTab,
  onTabChange,
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
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}

export default function Page() {
  const runtime = useStudentPageRuntime();
  return (
    <StudentProfilePageContent
      user={runtime.currentUser}
      achievements={runtime.studentAchievements}
      badges={runtime.studentBadges}
      subscribers={runtime.studentSubscribers}
      publicStats={runtime.publicStats}
      onOpenSubscribers={runtime.openSubscribersFromProfile}
      setCurrentUser={runtime.setCurrentUser}
      onChangePassword={runtime.handleChangePassword}
      onDeleteAccount={runtime.handleDeleteAccount}
      activeTab={runtime.studentProfileTab}
      onTabChange={runtime.onProfileTabChange}
    />
  );
}
