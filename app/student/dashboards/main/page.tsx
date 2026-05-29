"use client";

import { StudentDashboardsSection } from "@/app/student/dashboards/main/section";
import type { Achievement } from "@/lib/types";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";

interface StudentDashboardsPageContentProps {
  achievements: Achievement[];
}

export function StudentDashboardsPageContent({
  achievements,
}: StudentDashboardsPageContentProps) {
  return <StudentDashboardsSection achievements={achievements} />;
}

export default function Page() {
  const runtime = useStudentPageRuntime();
  return <StudentDashboardsPageContent achievements={runtime.studentAchievements} />;
}
