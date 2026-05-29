"use client";

import { StudentHrProfileSection } from "@/app/student/hr-profile/view/section";
import type { AuthUser } from "@/lib/types";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";

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
  const runtime = useStudentPageRuntime();
  return (
    <StudentHrProfilePageContent
      hrUser={runtime.selectedHrProfileUser}
      onBack={runtime.backFromHrProfile}
    />
  );
}
