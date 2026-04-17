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

const HR_SUBSCRIPTIONS_STORAGE_KEY = "hta.store.hr.subscriptions";
const HR_INVITATIONS_STORAGE_KEY = "hta.store.hr.invitations";
const HR_DEFAULT_INVITE_COMMENT_KEY = "hta.store.hr.default-invite-comment";
const HR_ACTION_CONFIRM_SETTINGS_KEY = "hta.store.hr.action-confirm-settings";
const HR_CANDIDATE_ACHIEVEMENT_UPDATES_KEY =
  "hta.store.hr.candidate-achievement-updates";

type CandidateSubscriptionsMap = Record<string, HrCandidateSubscription[]>;
type HrDefaultInviteCommentMap = Record<string, string>;
type HrActionConfirmSettingsMap = Record<string, HrActionConfirmSettings>;
type HrCandidateAchievementUpdatesMap = Record<string, Record<string, string>>;

const DEFAULT_HR_ACTION_CONFIRM_SETTINGS: HrActionConfirmSettings = {
  confirmReject: true,
  confirmArchive: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isInvitationStatus(value: unknown): value is HrInvitationStatus {
  return value === "pending" || value === "accepted" || value === "rejected";
}

function getSubscriptionsMap(): CandidateSubscriptionsMap {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(localStorage.getItem(HR_SUBSCRIPTIONS_STORAGE_KEY));
  if (!isRecord(parsed)) return {};

  const result: CandidateSubscriptionsMap = {};

  Object.entries(parsed).forEach(([candidateId, value]) => {
    if (!Array.isArray(value)) return;

    const normalized = value
      .map((entry): HrCandidateSubscription | null => {
        if (!isRecord(entry)) return null;

        const hrId = typeof entry.hrId === "string" ? entry.hrId : "";
        const subscribedAt =
          typeof entry.subscribedAt === "string"
            ? entry.subscribedAt
            : new Date().toISOString();

        if (!hrId) return null;

        return { hrId, subscribedAt };
      })
      .filter((entry): entry is HrCandidateSubscription => entry !== null);

    result[candidateId] = normalized;
  });

  return result;
}

function setSubscriptionsMap(map: CandidateSubscriptionsMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HR_SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(map));
}

export function getHrCandidateSubscriberIds(candidateId: string): string[] {
  const map = getSubscriptionsMap();
  return (map[candidateId] ?? []).map((entry) => entry.hrId);
}

export function isHrSubscribedToCandidate(
  candidateId: string,
  hrId: string,
): boolean {
  return getHrCandidateSubscriberIds(candidateId).includes(hrId);
}

export function toggleHrCandidateSubscription(
  candidateId: string,
  hrId: string,
): { isSubscribed: boolean; subscribedAt?: string } {
  const map = getSubscriptionsMap();
  const current = map[candidateId] ?? [];
  const exists = current.some((entry) => entry.hrId === hrId);

  if (exists) {
    map[candidateId] = current.filter((entry) => entry.hrId !== hrId);
    setSubscriptionsMap(map);
    return { isSubscribed: false };
  }

  const subscribedAt = new Date().toISOString();
  map[candidateId] = [{ hrId, subscribedAt }, ...current];
  setSubscriptionsMap(map);
  return { isSubscribed: true, subscribedAt };
}

export function getHrCandidateSubscriptions(
  candidateId: string,
): HrCandidateSubscription[] {
  const map = getSubscriptionsMap();
  return map[candidateId] ?? [];
}

function getInvitations(): HrCandidateInvitation[] {
  if (typeof window === "undefined") return [];

  const parsed = parseJson(localStorage.getItem(HR_INVITATIONS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item): HrCandidateInvitation | null => {
      if (!isRecord(item)) return null;

      const id = typeof item.id === "string" ? item.id : "";
      const candidateId =
        typeof item.candidateId === "string" ? item.candidateId : "";
      const candidateName =
        typeof item.candidateName === "string" ? item.candidateName : "";
      const hrId = typeof item.hrId === "string" ? item.hrId : "";
      const hrName = typeof item.hrName === "string" ? item.hrName : "";
      const position = typeof item.position === "string" ? item.position : "";
      const message = typeof item.message === "string" ? item.message : "";
      const sendNow = Boolean(item.sendNow);
      const scheduledAt =
        typeof item.scheduledAt === "string" ? item.scheduledAt : undefined;
      const status = item.status;
      const createdAt =
        typeof item.createdAt === "string" ? item.createdAt : "";
      const respondedAt =
        typeof item.respondedAt === "string" ? item.respondedAt : undefined;

      if (
        !id ||
        !candidateId ||
        !candidateName ||
        !hrId ||
        !hrName ||
        !position ||
        !createdAt ||
        !isInvitationStatus(status)
      ) {
        return null;
      }

      return {
        id,
        candidateId,
        candidateName,
        hrId,
        hrName,
        position,
        message,
        sendNow,
        scheduledAt,
        status,
        createdAt,
        respondedAt,
      };
    })
    .filter((item): item is HrCandidateInvitation => item !== null)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

function setInvitations(invitations: HrCandidateInvitation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HR_INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
}

export function createHrInvitation(
  payload: Omit<
    HrCandidateInvitation,
    "id" | "createdAt" | "status" | "respondedAt"
  >,
): HrCandidateInvitation {
  const invitation: HrCandidateInvitation = {
    id: `hr-invite-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    candidateId: payload.candidateId,
    candidateName: payload.candidateName,
    hrId: payload.hrId,
    hrName: payload.hrName,
    position: payload.position,
    message: payload.message,
    sendNow: payload.sendNow,
    scheduledAt: payload.scheduledAt,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  setInvitations([invitation, ...getInvitations()]);
  return invitation;
}

export function getStudentHrInvitations(
  studentId: string,
): HrCandidateInvitation[] {
  return getInvitations().filter((item) => item.candidateId === studentId);
}

export function respondToHrInvitation(
  invitationId: string,
  response: Extract<HrInvitationStatus, "accepted" | "rejected">,
): HrCandidateInvitation | null {
  const invitations = getInvitations();
  const target = invitations.find((item) => item.id === invitationId);
  if (!target || target.status !== "pending") return null;

  const updated: HrCandidateInvitation = {
    ...target,
    status: response,
    respondedAt: new Date().toISOString(),
  };

  setInvitations(
    invitations.map((item) => (item.id === invitationId ? updated : item)),
  );

  return updated;
}

export function getHrInvitationsForCandidate(
  candidateId: string,
): HrCandidateInvitation[] {
  return getInvitations().filter((item) => item.candidateId === candidateId);
}

function getHrDefaultInviteCommentMap(): HrDefaultInviteCommentMap {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(localStorage.getItem(HR_DEFAULT_INVITE_COMMENT_KEY));
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<HrDefaultInviteCommentMap>(
    (acc, [hrId, comment]) => {
      if (typeof comment === "string") {
        acc[hrId] = comment;
      }
      return acc;
    },
    {},
  );
}

function setHrDefaultInviteCommentMap(map: HrDefaultInviteCommentMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HR_DEFAULT_INVITE_COMMENT_KEY, JSON.stringify(map));
}

export function getHrDefaultInviteComment(hrId: string): string {
  return getHrDefaultInviteCommentMap()[hrId] ?? "";
}

export function setHrDefaultInviteComment(hrId: string, comment: string) {
  const map = getHrDefaultInviteCommentMap();
  map[hrId] = comment;
  setHrDefaultInviteCommentMap(map);
}

function getHrActionConfirmSettingsMap(): HrActionConfirmSettingsMap {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(
    localStorage.getItem(HR_ACTION_CONFIRM_SETTINGS_KEY),
  );
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<HrActionConfirmSettingsMap>(
    (acc, [hrId, value]) => {
      if (!isRecord(value)) return acc;

      const confirmReject =
        typeof value.confirmReject === "boolean"
          ? value.confirmReject
          : DEFAULT_HR_ACTION_CONFIRM_SETTINGS.confirmReject;
      const confirmArchive =
        typeof value.confirmArchive === "boolean"
          ? value.confirmArchive
          : DEFAULT_HR_ACTION_CONFIRM_SETTINGS.confirmArchive;

      acc[hrId] = { confirmReject, confirmArchive };
      return acc;
    },
    {},
  );
}

function setHrActionConfirmSettingsMap(map: HrActionConfirmSettingsMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HR_ACTION_CONFIRM_SETTINGS_KEY, JSON.stringify(map));
}

export function getHrActionConfirmSettings(
  hrId: string,
): HrActionConfirmSettings {
  const map = getHrActionConfirmSettingsMap();
  return map[hrId] ?? { ...DEFAULT_HR_ACTION_CONFIRM_SETTINGS };
}

export function setHrActionConfirmSettings(
  hrId: string,
  settings: HrActionConfirmSettings,
) {
  const map = getHrActionConfirmSettingsMap();
  map[hrId] = {
    confirmReject: settings.confirmReject,
    confirmArchive: settings.confirmArchive,
  };
  setHrActionConfirmSettingsMap(map);
}

function getHrCandidateAchievementUpdatesMap(): HrCandidateAchievementUpdatesMap {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(
    localStorage.getItem(HR_CANDIDATE_ACHIEVEMENT_UPDATES_KEY),
  );
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<HrCandidateAchievementUpdatesMap>(
    (acc, [hrId, value]) => {
      if (!isRecord(value)) return acc;

      const updates = Object.entries(value).reduce<Record<string, string>>(
        (candidateAcc, [candidateId, updatedAt]) => {
          if (typeof updatedAt === "string" && updatedAt) {
            candidateAcc[candidateId] = updatedAt;
          }
          return candidateAcc;
        },
        {},
      );

      acc[hrId] = updates;
      return acc;
    },
    {},
  );
}

function setHrCandidateAchievementUpdatesMap(
  map: HrCandidateAchievementUpdatesMap,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    HR_CANDIDATE_ACHIEVEMENT_UPDATES_KEY,
    JSON.stringify(map),
  );
}

export function hasHrCandidateAchievementUpdate(
  hrId: string,
  candidateId: string,
): boolean {
  const map = getHrCandidateAchievementUpdatesMap();
  return Boolean(map[hrId]?.[candidateId]);
}

export function markHrCandidateAchievementUpdate(
  hrId: string,
  candidateId: string,
) {
  const map = getHrCandidateAchievementUpdatesMap();
  map[hrId] = {
    ...(map[hrId] ?? {}),
    [candidateId]: new Date().toISOString(),
  };
  setHrCandidateAchievementUpdatesMap(map);
}

export function clearHrCandidateAchievementUpdate(
  hrId: string,
  candidateId: string,
) {
  const map = getHrCandidateAchievementUpdatesMap();
  if (!map[hrId]?.[candidateId]) return;

  const { [candidateId]: _ignored, ...rest } = map[hrId];
  map[hrId] = rest;
  setHrCandidateAchievementUpdatesMap(map);
}

export function clearHrCandidateAchievementUpdates(
  hrId: string,
  candidateIds: string[],
) {
  if (candidateIds.length === 0) return;

  const map = getHrCandidateAchievementUpdatesMap();
  const current = map[hrId] ?? {};

  candidateIds.forEach((candidateId) => {
    delete current[candidateId];
  });

  map[hrId] = current;
  setHrCandidateAchievementUpdatesMap(map);
}
