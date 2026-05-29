"use client";

import {
  Home,
  BarChart3,
  Award,
  CalendarDays,
  ClipboardCheck,
  UserRoundCog,
  Search,
  MailOpen,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole, OrganizerView, HrView } from "@/lib/types";
import {
  STUDENT_ROUTES,
  buildStudentAchievementsPath,
  buildStudentEventsPath,
  buildStudentProfilePath,
} from "@/app/shared/routing/app-shell-routes";

interface SidebarProps {
  role: UserRole;
  organizerView: OrganizerView;
  hrView: HrView;
  onOrganizerViewChange: (view: OrganizerView) => void;
  onHrViewChange: (view: HrView) => void;
}

const STUDENT_ITEMS = [
  { id: "home", label: "Главная", icon: Home },
  { id: "events", label: "Мероприятия", icon: CalendarDays },
  { id: "dashboards", label: "Дашборды", icon: BarChart3 },
  { id: "achievements", label: "Достижения", icon: Award },
  { id: "invitations", label: "Приглашения", icon: MailOpen },
  { id: "profile", label: "Личный кабинет", icon: UserRoundCog },
];

const ORGANIZER_ITEMS = [
  { id: "events" as OrganizerView, label: "Мероприятия", icon: CalendarDays },
  {
    id: "verification-requests" as OrganizerView,
    label: "Запросы",
    icon: ClipboardCheck,
  },
  {
    id: "profile" as OrganizerView,
    label: "Личный кабинет",
    icon: UserRoundCog,
  },
];

const HR_ITEMS = [
  { id: "home" as HrView, label: "Главная", icon: Home },
  { id: "dashboards" as HrView, label: "Дашборд", icon: BarChart3 },
  {
    id: "candidates-search" as HrView,
    label: "Поиск кандидатов",
    icon: Search,
  },
  {
    id: "profile" as HrView,
    label: "Личный кабинет",
    icon: UserRoundCog,
  },
];

export function Sidebar({
  role,
  organizerView,
  hrView,
  onOrganizerViewChange,
  onHrViewChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items =
    role === "student"
      ? STUDENT_ITEMS
      : role === "organizer"
        ? ORGANIZER_ITEMS
        : HR_ITEMS;
  const isStudent = role === "student";

  const isStudentActive = (id: string) => {
    if (id === "home") return pathname === STUDENT_ROUTES.home;
    if (id === "events") return pathname.startsWith("/student/events/");
    if (id === "dashboards") return pathname === STUDENT_ROUTES.dashboards;
    if (id === "achievements")
      return pathname.startsWith(`${STUDENT_ROUTES.achievements}/`);
    if (id === "invitations") return pathname === STUDENT_ROUTES.invitations;
    if (id === "profile") return pathname.startsWith(`${STUDENT_ROUTES.profile}/`);
    return false;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-20 flex h-screen w-64 flex-col",
        isStudent
          ? "border-r border-white/45 bg-white/42 backdrop-blur-2xl shadow-[18px_0_45px_-36px_rgba(60,84,132,0.85)]"
          : "border-r border-border bg-sidebar",
      )}>
      <div
        className={cn(
          "px-8 h-16 items-start flex flex-col justify-center",
          isStudent
            ? "border-b border-white/45"
            : "border-b border-sidebar-border",
        )}>
        <h1
          className={cn(
            "text-xl font-bold leading-tight",
            isStudent ? "text-slate-900" : "text-sidebar-foreground",
          )}>
          Горизонт
        </h1>
        <p
          className={cn(
            "mt-1 text-xs",
            isStudent ? "text-slate-700" : "text-muted-foreground",
          )}>
          {role === "student"
            ? "Профиль ученика"
            : role === "organizer"
              ? "Панель организатора"
              : "Панель HR"}
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (role === "student") {
                if (id === "home") router.push(STUDENT_ROUTES.home);
                else if (id === "events") router.push(buildStudentEventsPath("table"));
                else if (id === "dashboards") router.push(STUDENT_ROUTES.dashboards);
                else if (id === "achievements")
                  router.push(buildStudentAchievementsPath("badges"));
                else if (id === "invitations") router.push(STUDENT_ROUTES.invitations);
                else if (id === "profile")
                  router.push(buildStudentProfilePath("personal"));
                return;
              }
              if (role === "organizer") {
                onOrganizerViewChange(id as OrganizerView);
                return;
              }
              onHrViewChange(id as HrView);
            }}
            className={cn(
              "w-full rounded-xl px-4 py-3 text-left transition-all",
              "flex items-center gap-3",
              isStudent && "border",
              isStudent
                ? isStudentActive(id)
                  ? "border-white/75 bg-white/72 font-semibold text-slate-900 shadow-[0_16px_30px_-22px_rgba(48,80,145,0.95)]"
                  : "border-transparent text-slate-700 hover:border-white/55 hover:bg-white/58 hover:text-slate-900"
                : (role === "organizer" ? organizerView : hrView) === id
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-secondary",
            )}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
