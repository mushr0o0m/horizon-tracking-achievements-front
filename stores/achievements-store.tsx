"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { Achievement, AchievementLevel, EventType } from "@/lib/types";

interface CreateAchievementRequestPayload {
  eventId: string;
  title: string;
  level: AchievementLevel;
  date: string;
  result: string;
  eventType: EventType;
  requestedOrganizerId: string;
  eventNotInList?: boolean;
  requestComment?: string;
}

type ReviewDecision = "Подтверждено" | "Отклонено";

interface AchievementsState {
  achievements: Achievement[];
}

type AchievementsRuntimeCache = {
  achievements: Achievement[];
};

const ACHIEVEMENTS_RUNTIME_CACHE_KEY =
  "__horizon_achievements_runtime_cache__";

function getAchievementsRuntimeCache(): AchievementsRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [ACHIEVEMENTS_RUNTIME_CACHE_KEY]?: AchievementsRuntimeCache;
  };

  if (!runtime[ACHIEVEMENTS_RUNTIME_CACHE_KEY]) {
    runtime[ACHIEVEMENTS_RUNTIME_CACHE_KEY] = {
      achievements: [],
    };
  }

  return runtime[ACHIEVEMENTS_RUNTIME_CACHE_KEY];
}

export function resetAchievementsStoreCache() {
  getAchievementsRuntimeCache().achievements = [];
}

type AchievementsAction =
  | { type: "SET_ALL"; payload: Achievement[] }
  | { type: "ADD_MANY"; payload: Achievement[] }
  | { type: "REMOVE_BY_STUDENT"; payload: { studentId: string } }
  | {
      type: "CREATE_REQUEST";
      payload: Achievement;
    }
  | {
      type: "REVIEW_REQUEST";
      payload: {
        achievementId: string;
        decision: ReviewDecision;
        comment?: string;
      };
    };

function achievementsReducer(
  state: AchievementsState,
  action: AchievementsAction,
): AchievementsState {
  switch (action.type) {
    case "SET_ALL":
      return {
        achievements: [...action.payload],
      };
    case "ADD_MANY":
      return {
        achievements: [...action.payload, ...state.achievements],
      };
    case "REMOVE_BY_STUDENT":
      return {
        achievements: state.achievements.filter(
          (item) => item.studentId !== action.payload.studentId,
        ),
      };
    case "CREATE_REQUEST": {
      return {
        achievements: [action.payload, ...state.achievements],
      };
    }
    case "REVIEW_REQUEST":
      return {
        achievements: state.achievements.map((achievement) =>
          achievement.id === action.payload.achievementId
            ? {
                ...achievement,
                status: action.payload.decision,
                verificationComment:
                  action.payload.comment?.trim() || undefined,
              }
            : achievement,
        ),
      };
    default:
      return state;
  }
}

interface AchievementsStoreContextValue {
  achievements: Achievement[];
  setAchievements: (items: Achievement[]) => void;
  addAchievements: (items: Achievement[]) => void;
  removeStudentAchievements: (studentId: string) => void;
  createAchievementRequest: (
    studentId: string,
    studentName: string,
    data: CreateAchievementRequestPayload,
  ) => Achievement;
  reviewAchievementRequest: (
    achievementId: string,
    decision: ReviewDecision,
    comment?: string,
  ) => void;
}

const AchievementsStoreContext =
  createContext<AchievementsStoreContextValue | null>(null);

function getInitialAchievements(): Achievement[] {
  return [...getAchievementsRuntimeCache().achievements];
}

export function AchievementsStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const runtimeCache = getAchievementsRuntimeCache();
  const [state, dispatch] = useReducer(achievementsReducer, {
    achievements: getInitialAchievements(),
  });

  useEffect(() => {
    runtimeCache.achievements = state.achievements;
  }, [runtimeCache, state.achievements]);

  const setAchievements = useCallback((items: Achievement[]) => {
    dispatch({ type: "SET_ALL", payload: items });
  }, []);

  const addAchievements = useCallback((items: Achievement[]) => {
    dispatch({ type: "ADD_MANY", payload: items });
  }, []);

  const removeStudentAchievements = useCallback((studentId: string) => {
    dispatch({ type: "REMOVE_BY_STUDENT", payload: { studentId } });
  }, []);

  const createAchievementRequest = useCallback(
    (
      studentId: string,
      studentName: string,
      data: CreateAchievementRequestPayload,
    ) => {
      const created: Achievement = {
        id: `req-${Date.now()}`,
        title: data.title,
        level: data.level,
        date: data.date,
        result: data.result,
        status: "На проверке",
        studentId,
        studentName,
        eventId: data.eventId,
        eventType: data.eventType,
        requestedOrganizerId: data.requestedOrganizerId,
        eventNotInList: Boolean(data.eventNotInList),
        requestComment: data.requestComment?.trim() || undefined,
        source: "manual",
      };
      dispatch({
        type: "CREATE_REQUEST",
        payload: created,
      });
      return created;
    },
    [],
  );

  const reviewAchievementRequest = useCallback(
    (achievementId: string, decision: ReviewDecision, comment?: string) => {
      dispatch({
        type: "REVIEW_REQUEST",
        payload: { achievementId, decision, comment },
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      achievements: state.achievements,
      setAchievements,
      addAchievements,
      removeStudentAchievements,
      createAchievementRequest,
      reviewAchievementRequest,
    }),
    [
      state.achievements,
      setAchievements,
      addAchievements,
      removeStudentAchievements,
      createAchievementRequest,
      reviewAchievementRequest,
    ],
  );

  return (
    <AchievementsStoreContext.Provider value={value}>
      {children}
    </AchievementsStoreContext.Provider>
  );
}

export function useAchievementsStore() {
  const context = useContext(AchievementsStoreContext);
  if (!context) {
    throw new Error(
      "useAchievementsStore must be used within AchievementsStoreProvider",
    );
  }
  return context;
}
