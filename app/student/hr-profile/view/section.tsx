"use client";

import { HrPublicProfilePage } from "@/components/hr/hr-public-profile-page";
import type { AuthUser } from "@/lib/types";

interface StudentHrProfileSectionProps {
  hrUser: AuthUser | null;
  onBack: () => void;
}

export function StudentHrProfileSection({
  hrUser,
  onBack,
}: StudentHrProfileSectionProps) {
  return <HrPublicProfilePage hrUser={hrUser} onBack={onBack} />;
}
