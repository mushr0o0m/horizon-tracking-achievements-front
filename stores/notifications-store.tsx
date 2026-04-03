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
import { AppNotification, AppNotificationType } from "@/lib/types";

const NOTIFICATIONS_STORAGE_KEY = "hta.store.notifications";

interface NotificationsState {
  notifications: AppNotification[];
}

type NotificationsAction =
  | {
      type: "ADD";
      payload: {
        userId: string;
        title: string;
        description: string;
        type: AppNotificationType;
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

interface NotificationsStoreContextValue {
  notifications: AppNotification[];
  addNotification: (
    userId: string,
    title: string,
    description: string,
    type: AppNotificationType,
  ) => void;
  markRead: (notificationId: string) => void;
  markAllRead: (userId: string) => void;
}

const NotificationsStoreContext =
  createContext<NotificationsStoreContextValue | null>(null);

function getInitialNotifications(): AppNotification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function NotificationsStoreProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(notificationsReducer, {
    notifications: getInitialNotifications(),
  });

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(state.notifications),
    );
  }, [state.notifications]);

  const addNotification = useCallback(
    (
      userId: string,
      title: string,
      description: string,
      type: AppNotificationType,
    ) => {
      dispatch({
        type: "ADD",
        payload: {
          userId,
          title,
          description,
          type,
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
      addNotification,
      markRead,
      markAllRead,
    }),
    [state.notifications, addNotification, markRead, markAllRead],
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
