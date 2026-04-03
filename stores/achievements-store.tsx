"use client";

import {
  createContext,
  useEffect,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { INITIAL_ACHIEVEMENTS } from "@/lib/data";
import { Achievement, AchievementLevel, EventType } from "@/lib/types";

const ACHIEVEMENTS_STORAGE_KEY = "hta.store.achievements";

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

interface SimulatedAchievementPayload {
  eventId: string;
  studentId: string;
  title: string;
  level: AchievementLevel;
  date: string;
  result: string;
  eventType: EventType;
}

type ReviewDecision = "Подтверждено" | "Отклонено";

interface AchievementsState {
  achievements: Achievement[];
}

type AchievementsAction =
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
    }
  | {
      type: "ADD_SIMULATED";
      payload: Achievement;
    };

function achievementsReducer(
  state: AchievementsState,
  action: AchievementsAction,
): AchievementsState {
  switch (action.type) {
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
    case "ADD_SIMULATED": {
      return {
        achievements: [action.payload, ...state.achievements],
      };
    }
    default:
      return state;
  }
}

interface AchievementsStoreContextValue {
  achievements: Achievement[];
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
  addSimulatedAchievement: (
    payload: SimulatedAchievementPayload,
  ) => Achievement;
}

const AchievementsStoreContext =
  createContext<AchievementsStoreContextValue | null>(null);

function getInitialAchievements(): Achievement[] {
  if (typeof window === "undefined") {
    return INITIAL_ACHIEVEMENTS;
  }

  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) {
      return INITIAL_ACHIEVEMENTS;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return INITIAL_ACHIEVEMENTS;
    }

    return parsed as Achievement[];
  } catch {
    return INITIAL_ACHIEVEMENTS;
  }
}

export function AchievementsStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(achievementsReducer, {
    achievements: getInitialAchievements(),
  });

  useEffect(() => {
    localStorage.setItem(
      ACHIEVEMENTS_STORAGE_KEY,
      JSON.stringify(state.achievements),
    );
  }, [state.achievements]);

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

  const addSimulatedAchievement = useCallback(
    (payload: SimulatedAchievementPayload) => {
      const created: Achievement = {
        id: `sim-${Date.now()}`,
        title: payload.title,
        level: payload.level,
        date: payload.date,
        result: payload.result,
        status: "Подтверждено",
        studentId: payload.studentId,
        eventId: payload.eventId,
        eventType: payload.eventType,
        source: "simulated",
      };
      dispatch({ type: "ADD_SIMULATED", payload: created });
      return created;
    },
    [],
  );

  const value = useMemo(
    () => ({
      achievements: state.achievements,
      addAchievements,
      removeStudentAchievements,
      createAchievementRequest,
      reviewAchievementRequest,
      addSimulatedAchievement,
    }),
    [
      state.achievements,
      addAchievements,
      removeStudentAchievements,
      createAchievementRequest,
      reviewAchievementRequest,
      addSimulatedAchievement,
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
