"use client";

import AppShellCommon from "@/app/_components/app-shell-common";
import { StudentInvitationsSection } from "@/app/student/invitations/list/section";
import type { HrCandidateInvitation } from "@/lib/hr-network";

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
  return <AppShellCommon />;
}
