"use client";

import { StudentInvitationsSection } from "@/app/student/invitations/list/section";
import type { HrCandidateInvitation } from "@/lib/hr-network";
import { useStudentPageRuntime } from "@/app/_components/student/use-student-page-runtime";

interface StudentInvitationsPageContentProps {
  invitations: HrCandidateInvitation[];
  onRespond: (
    invitationId: string,
    response: "accepted" | "rejected",
  ) => string | null;
}

export function StudentInvitationsPageContent({
  invitations,
  onRespond,
}: StudentInvitationsPageContentProps) {
  return (
    <StudentInvitationsSection
      invitations={invitations}
      onRespond={onRespond}
    />
  );
}

export default function Page() {
  const runtime = useStudentPageRuntime({ loadInvitations: true });
  return (
    <StudentInvitationsPageContent
      invitations={runtime.studentInvitations}
      onRespond={runtime.respondToInvitation}
    />
  );
}
