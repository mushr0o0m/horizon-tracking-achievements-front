"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentHrProfileSection } from "@/app/student/hr-profile/view/section";
import type { AuthUser } from "@/lib/types";

interface StudentHrProfilePageContentProps {
  hrUser: AuthUser | null;
  onBack: () => void;
}

export function StudentHrProfilePageContent({
  hrUser,
  onBack,
}: StudentHrProfilePageContentProps) {
  return <StudentHrProfileSection hrUser={hrUser} onBack={onBack} />;
}

export default function Page() {
  return <AppShellCommon />;
}
