"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentDashboardsSection } from "@/app/student/dashboards/main/section";
import type { Achievement } from "@/lib/types";

interface StudentDashboardsPageContentProps {
  achievements: Achievement[];
}

export function StudentDashboardsPageContent({
  achievements,
}: StudentDashboardsPageContentProps) {
  return <StudentDashboardsSection achievements={achievements} />;
}

export default function Page() {
  return <AppShellCommon />;
}
