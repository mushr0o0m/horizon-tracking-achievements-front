"use client";

import {
  createContext,
  ReactNode,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import { AppNotification, AppNotificationType } from "@/lib/types";

interface NotificationsState {
  notifications: AppNotification[];
}

type NotificationsRuntimeCache = {
  notifications: AppNotification[];
};

const NOTIFICATIONS_RUNTIME_CACHE_KEY =
  "__horizon_notifications_runtime_cache__";

function getNotificationsRuntimeCache(): NotificationsRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [NOTIFICATIONS_RUNTIME_CACHE_KEY]?: NotificationsRuntimeCache;
  };

  if (!runtime[NOTIFICATIONS_RUNTIME_CACHE_KEY]) {
    runtime[NOTIFICATIONS_RUNTIME_CACHE_KEY] = {
      notifications: [],
    };
  }

  return runtime[NOTIFICATIONS_RUNTIME_CACHE_KEY];
}

export function resetNotificationsStoreCache() {
  getNotificationsRuntimeCache().notifications = [];
}

type NotificationsAction =
  | { type: "SET_ALL"; payload: AppNotification[] }
  | {
      type: "ADD";
      payload: {
        userId: string;
        title: string;
        description: string;
        type: AppNotificationType;
        candidateId?: string;
      };
    }
  | {
      type: "MARK_READ";
      payload: {
        notificationId: string;
      };
    }
  | {
      type: "MARK_ALL_READ";
      payload: {
        userId: string;
      };
    };

function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case "SET_ALL":
      return {
        notifications: [...action.payload],
      };
    case "ADD":
      return {
        notifications: [
          {
            id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            userId: action.payload.userId,
            title: action.payload.title,
            description: action.payload.description,
            type: action.payload.type,
            createdAt: new Date().toISOString(),
            isRead: false,
            candidateId: action.payload.candidateId,
          },
          ...state.notifications,
        ],
      };
    case "MARK_READ":
      return {
        notifications: state.notifications.map((item) =>
          item.id === action.payload.notificationId
            ? { ...item, isRead: true }
            : item,
        ),
      };
    case "MARK_ALL_READ":
      return {
        notifications: state.notifications.map((item) =>
          item.userId === action.payload.userId
            ? { ...item, isRead: true }
            : item,
        ),
      };
    default:
      return state;
  }
}

function getInitialNotificationsState(): NotificationsState {
  return {
    notifications: [...getNotificationsRuntimeCache().notifications],
  };
}

interface NotificationsStoreContextValue {
  notifications: AppNotification[];
  setNotifications: (items: AppNotification[]) => void;
  addNotification: (
    userId: string,
    title: string,
    description: string,
    type: AppNotificationType,
    candidateId?: string,
  ) => void;
  markRead: (notificationId: string) => void;
  markAllRead: (userId: string) => void;
}

const NotificationsStoreContext =
  createContext<NotificationsStoreContextValue | null>(null);

export function NotificationsStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(
    notificationsReducer,
    undefined,
    getInitialNotificationsState,
  );
  const runtimeCache = getNotificationsRuntimeCache();

  useEffect(() => {
    runtimeCache.notifications = state.notifications;
  }, [runtimeCache, state.notifications]);

  const setNotifications = useCallback((items: AppNotification[]) => {
    dispatch({ type: "SET_ALL", payload: items });
  }, []);

  const addNotification = useCallback(
    (
      userId: string,
      title: string,
      description: string,
      type: AppNotificationType,
      candidateId?: string,
    ) => {
      dispatch({
        type: "ADD",
        payload: {
          userId,
          title,
          description,
          type,
          candidateId,
        },
      });
    },
    [],
  );

  const markRead = useCallback((notificationId: string) => {
    dispatch({ type: "MARK_READ", payload: { notificationId } });
  }, []);

  const markAllRead = useCallback((userId: string) => {
    dispatch({ type: "MARK_ALL_READ", payload: { userId } });
  }, []);

  const value = useMemo(
    () => ({
      notifications: state.notifications,
      setNotifications,
      addNotification,
      markRead,
      markAllRead,
    }),
    [
      state.notifications,
      setNotifications,
      addNotification,
      markRead,
      markAllRead,
    ],
  );

  return (
    <NotificationsStoreContext.Provider value={value}>
      {children}
    </NotificationsStoreContext.Provider>
  );
}

export function useNotificationsStore() {
  const context = useContext(NotificationsStoreContext);
  if (!context) {
    throw new Error(
      "useNotificationsStore must be used within NotificationsStoreProvider",
    );
  }
  return context;
}
