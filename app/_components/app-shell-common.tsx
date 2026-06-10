"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AppNotification,
  AuthUser,
  UserRole,
  OrganizerView,
  HrView,
} from "@/lib/types";
import { HrCandidatesSearchFiltersState } from "@/components/hr/hr-candidates-search-page";
import {
  LoginPayload,
  RegisterForm,
  RegistrationPayload,
} from "@/components/shared/register-form";
import {
  EventsStoreProvider,
  resetEventsStoreCache,
  useEventsStore,
} from "@/stores/events-store";
import {
  AchievementsStoreProvider,
  resetAchievementsStoreCache,
  useAchievementsStore,
} from "@/stores/achievements-store";
import {
  NotificationsStoreProvider,
  resetNotificationsStoreCache,
  useNotificationsStore,
} from "@/stores/notifications-store";
import { AppShellWrapper } from "@/app/_components/app-shell-wrapper";
import { StudentRouteProvider } from "@/app/_components/student/student-route-context";
import { StudentShellContent } from "@/app/_components/roles/student-shell-content";
import { OrganizerShellContent } from "@/app/_components/roles/organizer-shell-content";
import { HrShellContent } from "@/app/_components/roles/hr-shell-content";
import {
  backendChangePassword,
  backendGetProfile,
  backendLogin,
  backendRegister,
  clearBackendToken,
  fetchNotifications,
  hasBackendToken,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/backend-api";
import {
  normalizeHrViewFromPath,
  normalizeOrganizerViewFromPath,
  parsePathParts,
} from "@/app/shared/routing/view-mappers";
import {
  buildHrPath,
  buildOrganizerPath,
  type StudentRouteOverride,
  STUDENT_ROUTES,
} from "@/app/shared/routing/app-shell-routes";
import { resetOrganizerEventsBootstrapCache } from "@/hooks/use-organizer-events-bootstrap";
import { resetOrganizerNotificationsBootstrapCache } from "@/hooks/use-organizer-notifications-bootstrap";
import { resetOrganizerVerificationRequestsCache } from "@/hooks/use-organizer-verification-requests-page";
import { resetOrganizerEventDetailsCache } from "@/hooks/use-organizer-event-details-page";
import { resetStudentEventsBootstrapCache } from "@/hooks/use-student-events-bootstrap";
import { resetStudentAchievementsBootstrapCache } from "@/hooks/use-student-achievements-bootstrap";
import { resetStudentSubscribersBootstrapCache } from "@/hooks/use-student-subscribers-bootstrap";
import { resetStudentNotificationsBootstrapCache } from "@/hooks/use-student-notifications-bootstrap";
import { Spinner } from "@/components/ui/spinner";
import { showErrorToast, showSuccessToast } from "@/lib/app-toast";

type NavigationState = {
  organizerView: OrganizerView;
  hrView: HrView;
};

type AppShellRuntimeCache = {
  authUser: AuthUser | null;
  authResolved: boolean;
  navigationState: NavigationState;
  navigationResolved: boolean;
};

const DEFAULT_NAVIGATION_STATE: NavigationState = {
  organizerView: "events",
  hrView: "home",
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

function resolveInitialNavigationFromPathname(pathname?: string): NavigationState {
  const fallback = DEFAULT_NAVIGATION_STATE;
  if (!pathname) return fallback;

  const { role, section, slug, tab } = parsePathParts(pathname);

  if (role === "organizer") {
    return {
      organizerView: normalizeOrganizerViewFromPath(section, tab),
      hrView: "home",
    };
  }
  if (role === "hr") {
    return {
      organizerView: "events",
      hrView: normalizeHrViewFromPath(section, slug, tab),
    };
  }

  return fallback;
}

interface AppShellCommonProps {
  studentRouteOverride?: StudentRouteOverride;
  children?: ReactNode;
}

function AppContent({ studentRouteOverride, children }: AppShellCommonProps) {
  const runtimeCache = getAppShellRuntimeCache();
  const router = useRouter();
  const pathname = usePathname();

  const { setEvents, setApplications } = useEventsStore();
  const { setAchievements } = useAchievementsStore();
  const { notifications, setNotifications } = useNotificationsStore();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(
    () => runtimeCache.authUser,
  );
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(
    () => runtimeCache.authResolved,
  );

  const initialNavigationStateRef = useRef(
    runtimeCache.navigationResolved
      ? runtimeCache.navigationState
      : resolveInitialNavigationFromPathname(
          typeof window !== "undefined" ? window.location.pathname : undefined,
        ),
  );
  const [organizerView, setOrganizerView] = useState<OrganizerView>(
    () => initialNavigationStateRef.current.organizerView,
  );
  const [hrView, setHrView] = useState<HrView>(
    () => initialNavigationStateRef.current.hrView,
  );
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
  }, [runtimeCache]);

  useEffect(() => {
    if (!isAuthResolved) return;
    runtimeCache.authUser = currentUser;
    runtimeCache.authResolved = true;
  }, [currentUser, isAuthResolved, runtimeCache]);

  useEffect(() => {
    runtimeCache.navigationState = {
      organizerView,
      hrView,
    };
    runtimeCache.navigationResolved = true;
  }, [organizerView, hrView, runtimeCache]);

  useEffect(() => {
    if (!currentUser) return;
    const expectedPrefix =
      currentUser.role === "student"
        ? "/student"
        : currentUser.role === "organizer"
          ? "/organizer"
          : "/hr";
    if (pathname.startsWith(expectedPrefix)) return;

    router.replace(
      currentUser.role === "student"
        ? STUDENT_ROUTES.home
        : currentUser.role === "organizer"
          ? buildOrganizerPath("events")
          : buildHrPath("home"),
      { scroll: false },
    );
  }, [currentUser, pathname, router]);

  const navigateAfterAuth = (user: AuthUser) => {
    if (user.role === "student") {
      router.replace(STUDENT_ROUTES.home, { scroll: false });
      return;
    }
    if (user.role === "organizer") {
      setOrganizerView("events");
      router.replace(buildOrganizerPath("events"), { scroll: false });
      return;
    }
    setHrView("home");
    router.replace(buildHrPath("home"), { scroll: false });
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
      showSuccessToast("Регистрация выполнена", "Аккаунт успешно создан.");
      return null;
    } catch (error) {
      const backendMessage = error instanceof Error ? error.message : "";
      if (backendMessage.toLowerCase().includes("already exists")) {
        showErrorToast("Пользователь с таким email уже существует.");
        return "Пользователь с таким email уже существует.";
      }
      console.warn("Backend registration failed.", error);
      showErrorToast(
        "Не удалось зарегистрироваться. Проверьте данные и повторите попытку.",
      );
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
      showSuccessToast("Вход выполнен", "Вы успешно вошли в систему.");
      return null;
    } catch (error) {
      console.warn("Backend login failed.", error);
      showErrorToast("Не удалось войти. Проверьте email и пароль.");
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
      showSuccessToast("Пароль обновлен");
      return null;
    } catch (error) {
      console.warn("Failed to update password.", error);
      showErrorToast("Не удалось обновить пароль. Проверьте текущий пароль.");
      return "Не удалось обновить пароль. Проверьте текущий пароль.";
    }
  };

  const resetToDefaultState = () => {
    runtimeCache.authUser = null;
    runtimeCache.authResolved = true;
    runtimeCache.navigationState = DEFAULT_NAVIGATION_STATE;
    runtimeCache.navigationResolved = true;
    setOrganizerView("events");
    setHrView("home");
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
    resetStudentEventsBootstrapCache();
    resetStudentAchievementsBootstrapCache();
    resetStudentSubscribersBootstrapCache();
    resetStudentNotificationsBootstrapCache();
    resetNotificationsStoreCache();
    resetEventsStoreCache();
    resetAchievementsStoreCache();
    setEvents([]);
    setAchievements([]);
    setNotifications([]);
    setApplications([]);
    setCurrentUser(null);
    resetToDefaultState();
    router.replace("/", { scroll: false });
    return null;
  };

  const handleLogout = () => {
    clearBackendToken();
    resetOrganizerEventsBootstrapCache();
    resetOrganizerNotificationsBootstrapCache();
    resetOrganizerVerificationRequestsCache();
    resetOrganizerEventDetailsCache();
    resetStudentEventsBootstrapCache();
    resetStudentAchievementsBootstrapCache();
    resetStudentSubscribersBootstrapCache();
    resetStudentNotificationsBootstrapCache();
    resetNotificationsStoreCache();
    resetEventsStoreCache();
    resetAchievementsStoreCache();
    setEvents([]);
    setAchievements([]);
    setNotifications([]);
    setApplications([]);
    setCurrentUser(null);
    resetToDefaultState();
    router.replace("/", { scroll: false });
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
    <AppShellWrapper
      role={role}
      organizerView={organizerView}
      hrView={hrView}
      onOrganizerViewChange={setOrganizerView}
      onHrViewChange={setHrView}
      user={currentUser}
      notifications={currentUserNotifications}
      onMarkNotificationRead={handleMarkNotificationRead}
      onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
      onLogout={handleLogout}>
      {role === "student" && (
        children ? (
          <StudentRouteProvider
            value={{
              currentUser,
              setCurrentUser,
              handleChangePassword,
              handleDeleteAccount,
            }}>
            {children}
          </StudentRouteProvider>
        ) : (
          <StudentShellContent
            currentUser={currentUser}
            routeOverride={studentRouteOverride}
            setCurrentUser={setCurrentUser}
            handleChangePassword={handleChangePassword}
            handleDeleteAccount={handleDeleteAccount}
          />
        )
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
  );
}

export default function App({
  studentRouteOverride,
  children,
}: AppShellCommonProps) {
  return (
    <EventsStoreProvider>
      <AchievementsStoreProvider>
        <NotificationsStoreProvider>
          <AppContent
            studentRouteOverride={studentRouteOverride}
            children={children}
          />
        </NotificationsStoreProvider>
      </AchievementsStoreProvider>
    </EventsStoreProvider>
  );
}
