export type HrInvitationStatus = "pending" | "accepted" | "rejected";

export interface HrCandidateSubscription {
  hrId: string;
  subscribedAt: string;
}

export interface HrCandidateInvitation {
  id: string;
  candidateId: string;
  candidateName: string;
  hrId: string;
  hrName: string;
  position: string;
  message: string;
  sendNow: boolean;
  scheduledAt?: string;
  status: HrInvitationStatus;
  createdAt: string;
  respondedAt?: string;
}

export interface HrActionConfirmSettings {
  confirmReject: boolean;
  confirmArchive: boolean;
}
