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
import { cn } from "@/lib/utils";
import { UserRole, StudentView, OrganizerView, HrView } from "@/lib/types";

interface SidebarProps {
  role: UserRole;
  studentView: StudentView;
  organizerView: OrganizerView;
  hrView: HrView;
  onStudentViewChange: (view: StudentView) => void;
  onOrganizerViewChange: (view: OrganizerView) => void;
  onHrViewChange: (view: HrView) => void;
}

const STUDENT_ITEMS = [
  { id: "home" as StudentView, label: "Главная", icon: Home },
  { id: "dashboards" as StudentView, label: "Дашборды", icon: BarChart3 },
  { id: "achievements" as StudentView, label: "Достижения", icon: Award },
  { id: "invitations" as StudentView, label: "Приглашения", icon: MailOpen },
  { id: "profile" as StudentView, label: "Личный кабинет", icon: UserRoundCog },
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
  studentView,
  organizerView,
  hrView,
  onStudentViewChange,
  onOrganizerViewChange,
  onHrViewChange,
}: SidebarProps) {
  const items =
    role === "student"
      ? STUDENT_ITEMS
      : role === "organizer"
        ? ORGANIZER_ITEMS
        : HR_ITEMS;
  const activeView =
    role === "student"
      ? studentView
      : role === "organizer"
        ? organizerView
        : hrView;
  const isStudent = role === "student";

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
          "p-6",
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
              if (role === "student") onStudentViewChange(id as StudentView);
              else if (role === "organizer")
                onOrganizerViewChange(id as OrganizerView);
              else onHrViewChange(id as HrView);
            }}
            className={cn(
              "w-full rounded-xl px-4 py-3 text-left transition-all",
              "flex items-center gap-3",
              isStudent && "border",
              isStudent
                ? activeView === id
                  ? "border-white/75 bg-white/72 font-semibold text-slate-900 shadow-[0_16px_30px_-22px_rgba(48,80,145,0.95)]"
                  : "border-transparent text-slate-700 hover:border-white/55 hover:bg-white/58 hover:text-slate-900"
                : activeView === id
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
