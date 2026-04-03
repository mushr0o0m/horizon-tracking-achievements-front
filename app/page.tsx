"use client";

import { useEffect, useState } from "react";
import { INITIAL_ACHIEVEMENTS, INITIAL_EVENTS } from "@/lib/data";
import {
  Achievement,
  AuthUser,
  CourseOption,
  Event,
  NotificationSettings,
  Participant,
  PublicProfile,
  SocialLinks,
  UserRole,
  StudentView,
  OrganizerView,
  AchievementLevel,
} from "@/lib/types";
import { calculateStudentMetrics } from "@/lib/metrics";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { HomePage } from "@/components/home-page";
import { DashboardsPage } from "@/components/dashboards-page";
import { AchievementsPage } from "@/components/achievements-page";
import { OrganizerEvents } from "@/components/organizer-events";
import { EventForm } from "@/components/event-form";
import { UploadResults } from "@/components/upload-results";
import { ProfilePage } from "@/components/profile-page";
import { RegisterForm, RegistrationPayload } from "@/components/register-form";
import { Sparkles } from "lucide-react";

const AUTH_USERS_KEY = "hta.auth.users";
const AUTH_SESSION_KEY = "hta.auth.session";

interface StoredAccount {
  email: string;
  password: string;
  user: AuthUser;
}

interface LegacyStoredAccount {
  email?: unknown;
  password?: unknown;
  user?: unknown;
  student?: unknown;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  invitations: true,
  verification: true,
  recommendations: true,
};

const DEFAULT_SOCIAL_LINKS: SocialLinks = {
  telegram: "",
  github: "",
  linkedin: "",
  website: "",
  customLinks: [],
};

function parseName(name: string): { firstName: string; lastName: string; middleName?: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] ?? "",
    firstName: parts[1] ?? parts[0] ?? "",
    middleName: parts[2] ?? "",
  };
}

function normalizeCourse(raw: unknown): CourseOption {
  const allowed: CourseOption[] = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "graduate",
    "magister",
    "postgraduate",
  ];
  return typeof raw === "string" && (allowed as string[]).includes(raw)
    ? (raw as CourseOption)
    : "1";
}

function normalizeSocialLinks(raw: unknown): SocialLinks {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SOCIAL_LINKS };
  }

  const maybe = raw as Partial<SocialLinks>;
  return {
    telegram: typeof maybe.telegram === "string" ? maybe.telegram : "",
    github: typeof maybe.github === "string" ? maybe.github : "",
    linkedin: typeof maybe.linkedin === "string" ? maybe.linkedin : "",
    website: typeof maybe.website === "string" ? maybe.website : "",
    customLinks: Array.isArray(maybe.customLinks)
      ? maybe.customLinks.filter((item): item is string => typeof item === "string").slice(0, 5)
      : [],
  };
}

function buildDefaultPublicProfile(name: string): PublicProfile {
  const parsed = parseName(name);
  return {
    avatarUrl: undefined,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    middleName: parsed.middleName,
    university: "",
    faculty: "",
    course: "1",
    city: "",
    bio: "",
    socialLinks: { ...DEFAULT_SOCIAL_LINKS },
    profileViews30d: 0,
  };
}

function normalizePublicProfile(raw: unknown, fallbackName: string): PublicProfile {
  const fallback = buildDefaultPublicProfile(fallbackName);
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const maybe = raw as Partial<PublicProfile>;
  return {
    avatarUrl: typeof maybe.avatarUrl === "string" ? maybe.avatarUrl : undefined,
    firstName: typeof maybe.firstName === "string" ? maybe.firstName : fallback.firstName,
    lastName: typeof maybe.lastName === "string" ? maybe.lastName : fallback.lastName,
    middleName: typeof maybe.middleName === "string" ? maybe.middleName : fallback.middleName,
    university: typeof maybe.university === "string" ? maybe.university : "",
    faculty: typeof maybe.faculty === "string" ? maybe.faculty : "",
    course: normalizeCourse(maybe.course),
    city: typeof maybe.city === "string" ? maybe.city : "",
    bio: typeof maybe.bio === "string" ? maybe.bio.slice(0, 1000) : "",
    socialLinks: normalizeSocialLinks(maybe.socialLinks),
    profileViews30d:
      typeof maybe.profileViews30d === "number" && Number.isFinite(maybe.profileViews30d)
        ? Math.max(0, Math.floor(maybe.profileViews30d))
        : 0,
  };
}

function normalizeNotifications(raw: unknown): NotificationSettings {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_NOTIFICATIONS;
  }

  const maybe = raw as Partial<NotificationSettings>;
  return {
    invitations:
      typeof maybe.invitations === "boolean"
        ? maybe.invitations
        : DEFAULT_NOTIFICATIONS.invitations,
    verification:
      typeof maybe.verification === "boolean"
        ? maybe.verification
        : DEFAULT_NOTIFICATIONS.verification,
    recommendations:
      typeof maybe.recommendations === "boolean"
        ? maybe.recommendations
        : DEFAULT_NOTIFICATIONS.recommendations,
  };
}

function normalizeUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;

  const maybe = raw as Partial<AuthUser> & { role?: unknown };
  const id =
    typeof maybe.id === "string" && maybe.id
      ? maybe.id
      : `student-${Date.now()}`;
  const name =
    typeof maybe.name === "string" && maybe.name.trim()
      ? maybe.name.trim()
      : "Пользователь";
  const email =
    typeof maybe.email === "string" && maybe.email.trim()
      ? maybe.email.trim().toLowerCase()
      : "";
  const role: UserRole = maybe.role === "organizer" ? "organizer" : "student";
  const phone = typeof maybe.phone === "string" ? maybe.phone : undefined;

  if (!email) return null;

  return {
    id,
    name,
    email,
    role,
    phone,
    notifications: normalizeNotifications((maybe as { notifications?: unknown }).notifications),
    publicProfile: normalizePublicProfile((maybe as { publicProfile?: unknown }).publicProfile, name),
  };
}

function parseStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry): StoredAccount | null => {
        const maybeEntry = entry as LegacyStoredAccount;
        const rawUser = maybeEntry.user ?? maybeEntry.student;
        const normalizedUser = normalizeUser(rawUser);
        const email =
          typeof maybeEntry.email === "string"
            ? maybeEntry.email.trim().toLowerCase()
            : (normalizedUser?.email ?? "");
        const password =
          typeof maybeEntry.password === "string" ? maybeEntry.password : "";

        if (!normalizedUser || !email || !password) {
          return null;
        }

        return {
          email,
          password,
          user: normalizedUser,
        };
      })
      .filter((entry): entry is StoredAccount => entry !== null);
  } catch {
    return [];
  }
}

function parseStoredSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeUser(parsed);
  } catch {
    return null;
  }
}

export default function App() {
  // Shared state — both roles read/write these
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [achievements, setAchievements] =
    useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(false);

  // Role & navigation state
  const [studentView, setStudentView] = useState<StudentView>("home");
  const [organizerView, setOrganizerView] = useState<OrganizerView>("events");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const role: UserRole = currentUser?.role ?? "student";

  useEffect(() => {
    setCurrentUser(parseStoredSession());
    setIsAuthResolved(true);
  }, []);

  const persistUserInStorage = (updatedUser: AuthUser, updatedPassword?: string) => {
    const accounts = parseStoredAccounts();
    const updatedAccounts = accounts.map((acc) => {
      if (acc.user.id !== updatedUser.id) return acc;

      return {
        ...acc,
        email: updatedUser.email,
        password: updatedPassword ?? acc.password,
        user: updatedUser,
      };
    });

    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedAccounts));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const handleRegister = (payload: RegistrationPayload): string | null => {
    const accounts = parseStoredAccounts();
    const duplicate = accounts.some(
      (acc) => acc.email === payload.email.toLowerCase(),
    );
    if (duplicate) {
      return "Пользователь с таким email уже существует.";
    }

    const userIdPrefix = payload.role === "organizer" ? "organizer" : "student";
    const createdUser: AuthUser = {
      id: `${userIdPrefix}-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      notifications: { ...DEFAULT_NOTIFICATIONS },
      publicProfile: buildDefaultPublicProfile(payload.name),
    };

    const updatedAccounts: StoredAccount[] = [
      ...accounts,
      { email: payload.email, password: payload.password, user: createdUser },
    ];
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedAccounts));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(createdUser));
    setCurrentUser(createdUser);
    if (createdUser.role === "student") {
      setStudentView("home");
    } else {
      setOrganizerView("events");
    }
    return null;
  };

  const handleUpdateEmail = (newEmail: string, currentPassword: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    const normalizedEmail = newEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return "Введите корректный email.";
    }

    const accounts = parseStoredAccounts();
    const currentAccount = accounts.find((acc) => acc.user.id === currentUser.id);
    if (!currentAccount) {
      return "Аккаунт не найден в хранилище.";
    }

    if (currentAccount.password !== currentPassword) {
      return "Текущий пароль введен неверно.";
    }

    const duplicate = accounts.some(
      (acc) => acc.user.id !== currentUser.id && acc.email === normalizedEmail,
    );
    if (duplicate) {
      return "Этот email уже используется другим аккаунтом.";
    }

    persistUserInStorage({ ...currentUser, email: normalizedEmail });
    return null;
  };

  const handleUpdatePhone = (phone: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    persistUserInStorage({ ...currentUser, phone: phone || undefined });
    return null;
  };

  const handleChangePassword = (currentPassword: string, newPassword: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";

    const accounts = parseStoredAccounts();
    const currentAccount = accounts.find((acc) => acc.user.id === currentUser.id);
    if (!currentAccount) {
      return "Аккаунт не найден в хранилище.";
    }

    if (currentAccount.password !== currentPassword) {
      return "Текущий пароль введен неверно.";
    }

    if (newPassword.length < 8) {
      return "Новый пароль должен содержать минимум 8 символов.";
    }

    persistUserInStorage(currentUser, newPassword);
    return null;
  };

  const handleUpdateNotifications = (notifications: NotificationSettings) => {
    if (!currentUser) return;
    persistUserInStorage({
      ...currentUser,
      notifications: {
        invitations: Boolean(notifications.invitations),
        verification: Boolean(notifications.verification),
        recommendations: Boolean(notifications.recommendations),
      },
    });
  };

  const handleUpdatePublicProfile = (publicProfile: PublicProfile) => {
    if (!currentUser) return;
    persistUserInStorage({ ...currentUser, publicProfile: normalizePublicProfile(publicProfile, currentUser.name) });
  };

  const handleDeleteAccount = (confirmationText: string): string | null => {
    if (!currentUser) return "Пользователь не найден.";
    if (confirmationText !== "УДАЛИТЬ") {
      return "Введите УДАЛИТЬ для подтверждения удаления аккаунта.";
    }

    const accounts = parseStoredAccounts();
    const updatedAccounts = accounts.filter((acc) => acc.user.id !== currentUser.id);
    localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(updatedAccounts));
    localStorage.removeItem(AUTH_SESSION_KEY);

    if (currentUser.role === "student") {
      setAchievements((prev) => prev.filter((item) => item.studentId !== currentUser.id));
    }

    setCurrentUser(null);
    setStudentView("home");
    setOrganizerView("events");
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_SESSION_KEY);
    setCurrentUser(null);
    setStudentView("home");
    setOrganizerView("events");
  };

  // ── Student: filter only this student's achievements ──────────────────────
  const studentAchievements =
    currentUser?.role === "student"
      ? achievements.filter((a) => a.studentId === currentUser.id)
      : [];

  const publicStats = calculateStudentMetrics(studentAchievements);

  // ── Demo: simulate publishing results for current student ─────────────────
  const handleSimulateResults = () => {
    if (!currentUser || currentUser.role !== "student") return;
    const levels: AchievementLevel[] = [
      "Международный",
      "Всероссийский",
      "Региональный",
    ];
    const eventTypes = [
      "Олимпиада",
      "Хакатон",
      "Конференция",
      "Чемпионат",
    ] as const;
    const results = ["1 место", "2 место", "3 место", "Призёр", "Медаль"];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const newAch: Achievement = {
      id: `sim-${Date.now()}`,
      title: `Симулированное мероприятие (${type})`,
      level,
      date: new Date().toISOString().split("T")[0],
      result: results[Math.floor(Math.random() * results.length)],
      status: "Подтверждено",
      studentId: currentUser.id,
      eventType: type,
      source: "simulated",
    };
    setAchievements((prev) => [newAch, ...prev]);
  };

  // ── Organizer: CRUD ────────────────────────────────────────────────────────
  const handleCreateEvent = (data: Omit<Event, "id" | "participantCount">) => {
    setEvents((prev) => [
      { ...data, id: `evt-${Date.now()}`, participantCount: 0 },
      ...prev,
    ]);
    setOrganizerView("events");
  };

  const handleEditEvent = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("edit-event");
  };

  const handleSaveEdit = (data: Omit<Event, "id" | "participantCount">) => {
    if (!selectedEventId) return;
    setEvents((prev) =>
      prev.map((e) => (e.id === selectedEventId ? { ...e, ...data } : e)),
    );
    setSelectedEventId(null);
    setOrganizerView("events");
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUploadResults = (id: string) => {
    setSelectedEventId(id);
    setOrganizerView("upload-results");
  };

  const handlePublishResults = (
    eventId: string,
    participants: Participant[],
  ) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const newAchievements: Achievement[] = participants.map((p) => ({
      id: `ach-${Date.now()}-${p.id}`,
      title: event.title,
      level: event.level,
      date: event.date,
      result: p.result,
      status: "Подтверждено" as const,
      studentId: p.studentId,
      eventId: event.id,
      eventType: event.type,
      source: "organizer" as const,
    }));
    setAchievements((prev) => [...newAchievements, ...prev]);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              participantCount: e.participantCount + participants.length,
              status: "Опубликовано" as const,
            }
          : e,
      ),
    );
    setSelectedEventId(null);
    setOrganizerView("events");
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  if (!isAuthResolved) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!currentUser) {
    return <RegisterForm onRegister={handleRegister} />;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        role={role}
        studentView={studentView}
        organizerView={organizerView}
        onStudentViewChange={setStudentView}
        onOrganizerViewChange={setOrganizerView}
      />
      <TopBar role={role} user={currentUser} onLogout={handleLogout} />

      <main className="ml-64 mt-16 flex-1 overflow-auto">
        <div className="p-8">
          {role === "student" && (
            <>
              {/* Simulate button — always visible in student role */}
              <div className="flex justify-end mb-6">
                <button
                  onClick={handleSimulateResults}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
                  <Sparkles className="w-4 h-4" />
                  Симулировать публикацию результатов
                </button>
              </div>

              {studentView === "home" && (
                <HomePage
                  achievements={studentAchievements}
                  events={events}
                  user={currentUser}
                />
              )}
              {studentView === "dashboards" && (
                <DashboardsPage achievements={studentAchievements} />
              )}
              {studentView === "achievements" && (
                <AchievementsPage achievements={studentAchievements} />
              )}
              {studentView === "profile" && (
                <ProfilePage
                  user={currentUser}
                  publicStats={publicStats}
                  onUpdateEmail={handleUpdateEmail}
                  onUpdatePhone={handleUpdatePhone}
                  onChangePassword={handleChangePassword}
                  onUpdateNotifications={handleUpdateNotifications}
                  onUpdatePublicProfile={handleUpdatePublicProfile}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
            </>
          )}

          {role === "organizer" && (
            <>
              {organizerView === "events" && (
                <OrganizerEvents
                  events={events}
                  onCreateEvent={() => setOrganizerView("create-event")}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleDeleteEvent}
                  onUploadResults={handleUploadResults}
                />
              )}
              {organizerView === "create-event" && (
                <EventForm
                  onBack={() => setOrganizerView("events")}
                  onSave={handleCreateEvent}
                />
              )}
              {organizerView === "edit-event" && selectedEvent && (
                <EventForm
                  initialEvent={selectedEvent}
                  onBack={() => {
                    setOrganizerView("events");
                    setSelectedEventId(null);
                  }}
                  onSave={handleSaveEdit}
                />
              )}
              {organizerView === "upload-results" && selectedEvent && (
                <UploadResults
                  event={selectedEvent}
                  onBack={() => {
                    setOrganizerView("events");
                    setSelectedEventId(null);
                  }}
                  onPublish={handlePublishResults}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
