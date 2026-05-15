"use client";

import { DashboardsPage } from "@/components/student/dashboards-page";
import type { Achievement } from "@/lib/types";

interface StudentDashboardsSectionProps {
  achievements: Achievement[];
}

export function StudentDashboardsSection({
  achievements,
}: StudentDashboardsSectionProps) {
  return <DashboardsPage achievements={achievements} />;
}
