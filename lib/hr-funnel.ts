export type HrFunnelStatus =
  | "Не отслеживается"
  | "На рассмотрении"
  | "Интересует"
  | "Приглашён"
  | "Ответили на приглашение"
  | "Отклонён";

export interface HrStatusHistoryEntry {
  id: string;
  candidateId: string;
  fromStatus: HrFunnelStatus;
  toStatus: HrFunnelStatus;
  changedAt: string;
  actorName?: string;
  note?: string;
}

export interface HrManualArchiveEntry {
  candidateId: string;
  archivedAt: string;
  actorName?: string;
  note?: string;
}

export const HR_FUNNEL_STATUSES: HrFunnelStatus[] = [
  "Не отслеживается",
  "На рассмотрении",
  "Интересует",
  "Приглашён",
  "Ответили на приглашение",
  "Отклонён",
];

const HR_CANDIDATE_STATUS_STORAGE_KEY = "hta.store.hr.candidate-statuses";
const HR_RECENT_ACTIONS_STORAGE_KEY = "hta.store.hr.recent-actions";
const HR_STATUS_HISTORY_STORAGE_KEY = "hta.store.hr.status-history";
const HR_CANDIDATE_NOTES_STORAGE_KEY = "hta.store.hr.candidate-notes";
const HR_MANUAL_ARCHIVE_STORAGE_KEY = "hta.store.hr.manual-archive";

type CandidateStatusOverrides = Record<string, HrFunnelStatus>;
type CandidateStatusHistoryMap = Record<string, HrStatusHistoryEntry[]>;
type CandidateNotesMap = Record<string, string>;
type CandidateManualArchiveMap = Record<string, HrManualArchiveEntry>;

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

export function isHrFunnelStatus(value: unknown): value is HrFunnelStatus {
  return (
    typeof value === "string" &&
    (HR_FUNNEL_STATUSES as string[]).includes(value)
  );
}

export function deriveHrFunnelStatusFromAchievementStats(stats: {
  confirmed: number;
  pending: number;
  rejected: number;
}): HrFunnelStatus {
  if (stats.pending > 0) return "На рассмотрении";
  if (stats.confirmed > 0) return "Интересует";
  if (stats.rejected > 0) return "Отклонён";
  return "Не отслеживается";
}

export function getHrCandidateStatusOverrides(): CandidateStatusOverrides {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(
    localStorage.getItem(HR_CANDIDATE_STATUS_STORAGE_KEY),
  );
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<CandidateStatusOverrides>(
    (acc, [candidateId, status]) => {
      if (isHrFunnelStatus(status)) {
        acc[candidateId] = status;
      }
      return acc;
    },
    {},
  );
}

export function setHrCandidateStatusOverrides(
  overrides: CandidateStatusOverrides,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    HR_CANDIDATE_STATUS_STORAGE_KEY,
    JSON.stringify(overrides),
  );
}

export function getHrCandidateStatus(
  candidateId: string,
  fallbackStatus: HrFunnelStatus = "Не отслеживается",
): HrFunnelStatus {
  const overrides = getHrCandidateStatusOverrides();
  return overrides[candidateId] ?? fallbackStatus;
}

export function getHrRecentActions(): string[] {
  if (typeof window === "undefined") return [];

  const parsed = parseJson(localStorage.getItem(HR_RECENT_ACTIONS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];

  return parsed.filter((item): item is string => typeof item === "string");
}

export function setHrRecentActions(actions: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HR_RECENT_ACTIONS_STORAGE_KEY, JSON.stringify(actions));
}

export function prependHrRecentAction(text: string, limit = 12): string[] {
  const next = [text, ...getHrRecentActions()].slice(0, limit);
  setHrRecentActions(next);
  return next;
}

function getHrStatusHistoryMap(): CandidateStatusHistoryMap {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(localStorage.getItem(HR_STATUS_HISTORY_STORAGE_KEY));
  if (!isRecord(parsed)) return {};

  const result: CandidateStatusHistoryMap = {};

  Object.entries(parsed).forEach(([candidateId, rawEntries]) => {
    if (!Array.isArray(rawEntries)) return;

    const entries = rawEntries
      .map((entry): HrStatusHistoryEntry | null => {
        if (!isRecord(entry)) return null;

        const id = typeof entry.id === "string" ? entry.id : "";
        const fromStatus = entry.fromStatus;
        const toStatus = entry.toStatus;
        const changedAt =
          typeof entry.changedAt === "string" ? entry.changedAt : "";
        const actorName =
          typeof entry.actorName === "string" ? entry.actorName : undefined;
        const note = typeof entry.note === "string" ? entry.note : undefined;

        if (
          !id ||
          !isHrFunnelStatus(fromStatus) ||
          !isHrFunnelStatus(toStatus) ||
          !changedAt
        ) {
          return null;
        }

        return {
          id,
          candidateId,
          fromStatus,
          toStatus,
          changedAt,
          actorName,
          note,
        };
      })
      .filter((entry): entry is HrStatusHistoryEntry => entry !== null);

    result[candidateId] = entries;
  });

  return result;
}

function setHrStatusHistoryMap(historyMap: CandidateStatusHistoryMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    HR_STATUS_HISTORY_STORAGE_KEY,
    JSON.stringify(historyMap),
  );
}

export function getHrCandidateStatusHistory(
  candidateId: string,
): HrStatusHistoryEntry[] {
  return getHrStatusHistoryMap()[candidateId] ?? [];
}

function appendHrStatusHistory(entry: HrStatusHistoryEntry) {
  const map = getHrStatusHistoryMap();
  const next = [entry, ...(map[entry.candidateId] ?? [])].slice(0, 30);
  map[entry.candidateId] = next;
  setHrStatusHistoryMap(map);
}

interface SetCandidateStatusOptions {
  fromStatus?: HrFunnelStatus;
  actorName?: string;
  note?: string;
  addRecentAction?: boolean;
}

export function setHrCandidateStatus(
  candidateId: string,
  toStatus: HrFunnelStatus,
  options?: SetCandidateStatusOptions,
): { actionText: string; historyEntry: HrStatusHistoryEntry } {
  const overrides = getHrCandidateStatusOverrides();
  const fromStatus =
    options?.fromStatus ?? overrides[candidateId] ?? "Не отслеживается";

  const nextOverrides: CandidateStatusOverrides = {
    ...overrides,
    [candidateId]: toStatus,
  };
  setHrCandidateStatusOverrides(nextOverrides);

  const historyEntry: HrStatusHistoryEntry = {
    id: `hr-status-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    candidateId,
    fromStatus,
    toStatus,
    changedAt: new Date().toISOString(),
    actorName: options?.actorName,
    note: options?.note,
  };

  appendHrStatusHistory(historyEntry);

  const actorPrefix = options?.actorName ? `${options.actorName}: ` : "";
  const noteSuffix = options?.note ? ` (${options.note})` : "";
  const actionText = `${new Date(historyEntry.changedAt).toLocaleString("ru-RU")} · ${actorPrefix}кандидат ${candidateId}: «${fromStatus}» → «${toStatus}»${noteSuffix}`;

  if (options?.addRecentAction !== false) {
    prependHrRecentAction(actionText);
  }

  return { actionText, historyEntry };
}

function getHrManualArchiveMap(): CandidateManualArchiveMap {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(localStorage.getItem(HR_MANUAL_ARCHIVE_STORAGE_KEY));
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<CandidateManualArchiveMap>(
    (acc, [candidateId, entry]) => {
      if (!isRecord(entry)) return acc;

      const archivedAt =
        typeof entry.archivedAt === "string" ? entry.archivedAt : "";
      const actorName =
        typeof entry.actorName === "string" ? entry.actorName : undefined;
      const note = typeof entry.note === "string" ? entry.note : undefined;

      if (!archivedAt) return acc;

      acc[candidateId] = {
        candidateId,
        archivedAt,
        actorName,
        note,
      };

      return acc;
    },
    {},
  );
}

function setHrManualArchiveMap(map: CandidateManualArchiveMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HR_MANUAL_ARCHIVE_STORAGE_KEY, JSON.stringify(map));
}

export function getHrManualArchivedCandidatesMap(): CandidateManualArchiveMap {
  return getHrManualArchiveMap();
}

export function getHrManualArchivedCandidate(
  candidateId: string,
): HrManualArchiveEntry | null {
  return getHrManualArchiveMap()[candidateId] ?? null;
}

export function archiveHrCandidateManually(
  candidateId: string,
  options?: { actorName?: string; note?: string; addRecentAction?: boolean },
): HrManualArchiveEntry {
  const map = getHrManualArchiveMap();

  const entry: HrManualArchiveEntry = {
    candidateId,
    archivedAt: new Date().toISOString(),
    actorName: options?.actorName,
    note: options?.note,
  };

  map[candidateId] = entry;
  setHrManualArchiveMap(map);

  if (options?.addRecentAction !== false) {
    const actorPrefix = options?.actorName ? `${options.actorName}: ` : "";
    const noteSuffix = options?.note ? ` (${options.note})` : "";
    prependHrRecentAction(
      `${new Date(entry.archivedAt).toLocaleString("ru-RU")} · ${actorPrefix}кандидат ${candidateId} добавлен в архив${noteSuffix}`,
    );
  }

  return entry;
}

function getHrCandidateNotesMap(): CandidateNotesMap {
  if (typeof window === "undefined") return {};

  const parsed = parseJson(
    localStorage.getItem(HR_CANDIDATE_NOTES_STORAGE_KEY),
  );
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<CandidateNotesMap>(
    (acc, [candidateId, note]) => {
      if (typeof note === "string") {
        acc[candidateId] = note;
      }
      return acc;
    },
    {},
  );
}

function setHrCandidateNotesMap(notesMap: CandidateNotesMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    HR_CANDIDATE_NOTES_STORAGE_KEY,
    JSON.stringify(notesMap),
  );
}

export function getHrCandidateNote(candidateId: string): string {
  return getHrCandidateNotesMap()[candidateId] ?? "";
}

export function setHrCandidateNote(candidateId: string, note: string) {
  const map = getHrCandidateNotesMap();
  map[candidateId] = note;
  setHrCandidateNotesMap(map);
}
