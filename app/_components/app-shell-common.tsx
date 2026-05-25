"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppNotification,
  AuthUser,
  UserRole,
  StudentView,
  OrganizerView,
  HrView,
} from "@/lib/types";
import {
  type StudentEventsFiltersState,
  type StudentEventsTab,
} from "@/components/student/student-events-page";
import { HrCandidatesSearchFiltersState } from "@/components/hr/hr-candidates-search-page";
import {
  LoginPayload,
  RegisterForm,
  RegistrationPayload,
} from "@/components/shared/register-form";
import {
  EVENT_LEVEL_TO_ACHIEVEMENT_LEVEL,
  EVENT_TYPE_TO_ACHIEVEMENT_TYPE,
} from "@/lib/event-meta";
import {
  EventsStoreProvider,
  useEventsStore,
} from "@/stores/events-store";
import {
  AchievementsStoreProvider,
  useAchievementsStore,
} from "@/stores/achievements-store";
import {
  NotificationsStoreProvider,
  useNotificationsStore,
} from "@/stores/notifications-store";
import { AppShellWrapper } from "@/app/_components/app-shell-wrapper";
import { StudentShellContent } from "@/app/_components/roles/student-shell-content";
import { OrganizerShellContent } from "@/app/_components/roles/organizer-shell-content";
import { HrShellContent } from "@/app/_components/roles/hr-shell-content";
import {
  backendLogin,
  backendRegister,
  backendGetProfile,
  backendChangePassword,
  clearBackendToken,
  fetchNotifications,
  hasBackendToken,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/backend-api";
import {
  normalizeHrViewFromPath,
  normalizeOrganizerViewFromPath,
  normalizeStudentViewFromPath,
  parsePathParts,
} from "@/app/shared/routing/view-mappers";
import { resetOrganizerEventsBootstrapCache } from "@/hooks/use-organizer-events-bootstrap";
import { resetOrganizerNotificationsBootstrapCache } from "@/hooks/use-organizer-notifications-bootstrap";
import { resetOrganizerVerificationRequestsCache } from "@/hooks/use-organizer-verification-requests-page";
import { resetOrganizerEventDetailsCache } from "@/hooks/use-organizer-event-details-page";
import { Spinner } from "@/components/ui/spinner";

type NavigationState = {
  studentView: StudentView;
  organizerView: OrganizerView;
  hrView: HrView;
  studentEventsTab: StudentEventsTab;
};

type AppShellRuntimeCache = {
  authUser: AuthUser | null;
  authResolved: boolean;
  navigationState: NavigationState;
  navigationResolved: boolean;
};

const DEFAULT_NAVIGATION_STATE: NavigationState = {
  studentView: "home",
  organizerView: "events",
  hrView: "home",
  studentEventsTab: "table",
};

const APP_SHELL_RUNTIME_CACHE_KEY = "__horizon_app_shell_runtime_cache__";

function getAppShellRuntimeCache(): AppShellRuntimeCache {
  const runtime = globalThis as typeof globalThis & {
    [APP_SHELL_RUNTIME_CACHE_KEY]?: AppShellRuntimeCache;
  };

  if (!runtime[APP_SHELL_RUNTIME_CACHE_KEY]) {
    runtime[APP_SHELL_RUNTIME_CACHE_KEY] = {
      authUser: null,
      authResolved: false,
      navigationState: DEFAULT_NAVIGATION_STATE,
      navigationResolved: false,
    };
  }

  return runtime[APP_SHELL_RUNTIME_CACHE_KEY];
}

function resolveInitialNavigationFromPathname(pathname?: string): {
  studentView: StudentView;
  organizerView: OrganizerView;
  hrView: HrView;
  studentEventsTab: StudentEventsTab;
} {
  const fallback = {
    studentView: "home" as StudentView,
    organizerView: "events" as OrganizerView,
    hrView: "home" as HrView,
    studentEventsTab: "table" as StudentEventsTab,
  };
  if (!pathname) return fallback;

  const { role, section, tab } = parsePathParts(pathname);

  if (role === "student") {
    const mapped = normalizeStudentViewFromPath(section, tab);
    return {
      ...fallback,
      studentView: mapped.view,
      studentEventsTab: mapped.eventsTab ?? "table",
    };
  }
  if (role === "organizer") {
    return {
      ...fallback,
      organizerView: normalizeOrganizerViewFromPath(section, tab),
    };
  }
  if (role === "hr") {
    return {
      ...fallback,
      hrView: normalizeHrViewFromPath(section, tab),
    };
  }

  return fallback;
}

function AppContent() {
  const runtimeCache = getAppShellRuntimeCache();

  // Shared state — both roles read/write these
  const { setEvents, setApplications } = useEventsStore();
  const { setAchievements } = useAchievementsStore();
  const { notifications, setNotifications } =
    useNotificationsStore();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    () => runtimeCache.authUser,
  );
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(
    () => runtimeCache.authResolved,
  );

  // Role & navigation state
  const initialNavigationStateRef = useRef(
    runtimeCache.navigationResolved
      ? runtimeCache.navigationState
      : resolveInitialNavigationFromPathname(
          typeof window !== "undefined" ? window.location.pathname : undefined,
        ),
  );
  const [studentView, setStudentView] = useState<StudentView>(
    () => initialNavigationStateRef.current.studentView,
  );
  const [organizerView, setOrganizerView] = useState<OrganizerView>(
    () => initialNavigationStateRef.current.organizerView,
  );
  const [hrView, setHrView] = useState<HrView>(
    () => initialNavigationStateRef.current.hrView,
  );
  const [studentEventsTab, setStudentEventsTab] = useState<StudentEventsTab>(
    () => initialNavigationStateRef.current.studentEventsTab,
  );
  const [studentEventsFilters, setStudentEventsFilters] =
    useState<StudentEventsFiltersState>({
      searchQuery: "",
      selectedType: "",
      selectedLevel: "",
      sortField: "date",
      sortOrder: "asc",
    });
  const [hrCandidatesSearchFilters, setHrCandidatesSearchFilters] =
    useState<HrCandidatesSearchFiltersState>({
      query: "",
      selectedUniversity: "all",
      selectedStatuses: [],
      sortState: null,
      page: 1,
    });

  const role: UserRole = currentUser?.role ?? "student";

  useEffect(() => {
    let cancelled = false;

    const resolveSession = async () => {
      if (!hasBackendToken()) {
        runtimeCache.authUser = null;
        runtimeCache.authResolved = true;
        if (!cancelled) {
          setCurrentUser(null);
          setIsAuthResolved(true);
        }
        return;
      }

      try {
        const profile = await backendGetProfile();
        runtimeCache.authUser = profile;
        runtimeCache.authResolved = true;
        if (!cancelled) {
          setCurrentUser(profile);
          setIsAuthResolved(true);
        }
      } catch (error) {
        clearBackendToken();
        runtimeCache.authUser = null;
        runtimeCache.authResolved = true;
        if (!cancelled) {
          setCurrentUser(null);
          setIsAuthResolved(true);
        }
      }
    };

    if (runtimeCache.authResolved) {
      if (!cancelled) {
        setCurrentUser(runtimeCache.authUser);
        setIsAuthResolved(true);
      }
    } else {
      resolveSession();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthResolved) return;
    runtimeCache.authUser = currentUser;
    runtimeCache.authResolved = true;
  }, [currentUser, isAuthResolved, runtimeCache]);

  useEffect(() => {
    runtimeCache.navigationState = {
      studentView,
      organizerView,
      hrView,
      studentEventsTab,
    };
    runtimeCache.navigationResolved = true;
  }, [studentView, organizerView, hrView, studentEventsTab, runtimeCache]);


  const navigateAfterAuth = (user: AuthUser) => {
    if (user.role === "student") {
      setStudentView("home");
    } else if (user.role === "organizer") {
      setOrganizerView("events");
    } else {
      setHrView("home");
    }
  };

  const handleRegister = async (
    payload: RegistrationPayload,
  ): Promise<string | null> => {
    try {
      const createdUser = await backendRegister(payload);
      setCurrentUser(createdUser);
      runtimeCache.authUser = createdUser;
      runtimeCache.authResolved = true;
      navigateAfterAuth(createdUser);
      return null;
    } catch (error) {
      const backendMessage = error instanceof Error ? error.message : "";
      if (backendMessage.toLowerCase().includes("already exists")) {
        return "Пользователь с таким email уже существует.";
      }
      console.warn("Backend registration failed.", error);
      return "Не удалось зарегистрироваться. Проверьте данные и повторите попытку.";
    }
  };

  const handleLogin = async (payload: LoginPayload): Promise<string | null> => {
    try {
      const user = await backendLogin(payload);
      setCurrentUser(user);
      runtimeCache.authUser = user;
      runtimeCache.authResolved = true;
      navigateAfterAuth(user);
      return null;
    } catch (error) {
      console.warn("Backend login failed.", error);
      return "Не удалось войти. Проверьте email и пароль.";
    }
  };

  const handleChangePassword = async (
    currentPassword: string,
    newPassword: string,
  ): Promise<string | null> => {
    if (!currentUser) return "Пользователь не найден.";
    if (newPassword.length < 8) {
      return "Новый пароль должен содержать минимум 8 символов.";
    }

    try {
      await backendChangePassword({
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      });
      return null;
    } catch (error) {
      console.warn("Failed to update password.", error);
      return "Не удалось обновить пароль. Проверьте текущий пароль.";
    }
  };

  const handleDeleteAccount = (confirmationText: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    if (confirmationText !== "УДАЛИТЬ") {
      return "Введите УДАЛИТЬ для подтверждения удаления аккаунта.";
    }

    clearBackendToken();
    resetOrganizerEventsBootstrapCache();
    resetOrganizerNotificationsBootstrapCache();
    resetOrganizerVerificationRequestsCache();
    resetOrganizerEventDetailsCache();
    setEvents([]);
    setAchievements([]);
    setNotifications([]);
    setApplications([]);

    setCurrentUser(null);
    runtimeCache.authUser = null;
    runtimeCache.authResolved = true;
    setStudentView("home");
    setOrganizerView("events");
    setHrView("home");
    setStudentEventsTab("table");
    runtimeCache.navigationState = DEFAULT_NAVIGATION_STATE;
    runtimeCache.navigationResolved = true;
    return null;
  };

  const handleLogout = () => {
    clearBackendToken();
    resetOrganizerEventsBootstrapCache();
    resetOrganizerNotificationsBootstrapCache();
    resetOrganizerVerificationRequestsCache();
    resetOrganizerEventDetailsCache();
    setEvents([]);
    setAchievements([]);
    setNotifications([]);
    setApplications([]);
    setCurrentUser(null);
    runtimeCache.authUser = null;
    runtimeCache.authResolved = true;
    setStudentView("home");
    setOrganizerView("events");
    setHrView("home");
    setStudentEventsTab("table");
    runtimeCache.navigationState = DEFAULT_NAVIGATION_STATE;
    runtimeCache.navigationResolved = true;
  };

  const currentUserNotifications: AppNotification[] = currentUser
    ? notifications.filter((item) => item.userId === currentUser.id)
    : [];
  const handleMarkNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!currentUser) return;

      try {
        await markNotificationRead(notificationId);
        const refreshed = await fetchNotifications(currentUser.id);
        setNotifications(refreshed);
      } catch (error) {
        console.warn("Failed to mark notification as read.", error);
      }
    },
    [currentUser, setNotifications],
  );
  const handleMarkAllNotificationsRead = useCallback(() => {
    if (!currentUser) return;

    const run = async () => {
      try {
        await markAllNotificationsRead();
        const refreshed = await fetchNotifications(currentUser.id);
        setNotifications(refreshed);
      } catch (error) {
        console.warn("Failed to mark notifications as read.", error);
      }
    };

    run();
  }, [currentUser, setNotifications]);
  if (!isAuthResolved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!currentUser) {
    return <RegisterForm onRegister={handleRegister} onLogin={handleLogin} />;
  }

  return (
    <>
      <AppShellWrapper
        role={role}
        studentView={studentView}
        organizerView={organizerView}
        hrView={hrView}
        onStudentViewChange={(view) => {
          if (view === "events") {
            setStudentEventsTab("table");
          }
          setStudentView(view);
        }}
        onOrganizerViewChange={setOrganizerView}
        onHrViewChange={setHrView}
        user={currentUser}
        notifications={currentUserNotifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onLogout={handleLogout}>
        {role === "student" && (
          <StudentShellContent
            currentUser={currentUser}
            studentView={studentView}
            setStudentView={setStudentView}
            setCurrentUser={setCurrentUser}
            studentEventsTab={studentEventsTab}
            setStudentEventsTab={setStudentEventsTab}
            studentEventsFilters={studentEventsFilters}
            setStudentEventsFilters={setStudentEventsFilters}
            handleChangePassword={handleChangePassword}
            handleDeleteAccount={handleDeleteAccount}
          />
        )}
        {role === "organizer" && (
          <OrganizerShellContent
            currentUser={currentUser}
            organizerView={organizerView}
            setOrganizerView={setOrganizerView}
            setCurrentUser={setCurrentUser}
            handleChangePassword={handleChangePassword}
            handleDeleteAccount={handleDeleteAccount}
          />
        )}
        {role === "hr" && (
          <HrShellContent
            currentUser={currentUser}
            hrView={hrView}
            setHrView={setHrView}
            setCurrentUser={setCurrentUser}
            handleMarkNotificationRead={handleMarkNotificationRead}
            handleMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            hrCandidatesSearchFilters={hrCandidatesSearchFilters}
            setHrCandidatesSearchFilters={setHrCandidatesSearchFilters}
            handleChangePassword={handleChangePassword}
            handleDeleteAccount={handleDeleteAccount}
          />
        )}
      </AppShellWrapper>
    </>
  );
}

export default function App() {
  return (
    <EventsStoreProvider>
      <AchievementsStoreProvider>
        <NotificationsStoreProvider>
          <AppContent />
        </NotificationsStoreProvider>
      </AchievementsStoreProvider>
    </EventsStoreProvider>
  );
}
