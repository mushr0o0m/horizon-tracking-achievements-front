"use client";

import { StudentInvitationsPage } from "@/components/student/student-invitations-page";
import type { HrCandidateInvitation } from "@/lib/hr-network";

interface StudentInvitationsSectionProps {
  invitations: HrCandidateInvitation[];
  onRespond: (
    invitationId: string,
    response: "accepted" | "rejected",
  ) => string | null;
}

export function StudentInvitationsSection({
  invitations,
  onRespond,
}: StudentInvitationsSectionProps) {
  return <StudentInvitationsPage invitations={invitations} onRespond={onRespond} />;
}
