"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { HrPublicProfilePage } from "@/components/hr/hr-public-profile-page";
import type { AuthUser } from "@/lib/types";

interface HrSubscriberProfileViewPageProps {
  hrUser?: AuthUser | null;
  onBack?: () => void;
}

export function HrSubscriberProfileViewPageContent({
  hrUser,
  onBack,
}: HrSubscriberProfileViewPageProps) {
  if (hrUser === undefined || !onBack) {
    return <AppShellCommon />;
  }

  return <HrPublicProfilePage hrUser={hrUser} onBack={onBack} />;
}

export default function Page() {
  return <AppShellCommon />;
}
