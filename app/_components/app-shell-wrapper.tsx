"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { TopBar } from "@/components/shared/topbar";
import type {
  AppNotification,
  AuthUser,
  HrView,
  OrganizerView,
  StudentView,
  UserRole,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface AppShellWrapperProps {
  role: UserRole;
  studentView: StudentView;
  organizerView: OrganizerView;
  hrView: HrView;
  onStudentViewChange: (view: StudentView) => void;
  onOrganizerViewChange: (view: OrganizerView) => void;
  onHrViewChange: (view: HrView) => void;
  user: AuthUser;
  notifications: AppNotification[];
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
  onLogout: () => void;
  children: ReactNode;
}

export function AppShellWrapper({
  role,
  studentView,
  organizerView,
  hrView,
  onStudentViewChange,
  onOrganizerViewChange,
  onHrViewChange,
  user,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onLogout,
  children,
}: AppShellWrapperProps) {
  const isStudentRole = role === "student";

  return (
    <div
      className={cn(
        "relative flex h-screen overflow-hidden",
        isStudentRole
          ? "bg-[radial-gradient(circle_at_12%_14%,rgba(255,177,215,0.52),transparent_33%),radial-gradient(circle_at_84%_18%,rgba(156,231,255,0.55),transparent_37%),radial-gradient(circle_at_82%_80%,rgba(188,255,216,0.5),transparent_36%),linear-gradient(135deg,#edf5ff_0%,#ebf9f0_44%,#ebefff_100%)]"
          : "bg-background",
      )}>
      {isStudentRole && (
        <>
          <div className="student-float-slow pointer-events-none absolute -left-28 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0)_70%)]" />
          <div className="student-float-fast pointer-events-none absolute right-10 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0)_72%)]" />
          <div className="student-float-slow pointer-events-none absolute bottom-[-90px] left-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0)_70%)]" />
        </>
      )}

      <Sidebar
        role={role}
        studentView={studentView}
        organizerView={organizerView}
        hrView={hrView}
        onStudentViewChange={onStudentViewChange}
        onOrganizerViewChange={onOrganizerViewChange}
        onHrViewChange={onHrViewChange}
      />

      <TopBar
        role={role}
        user={user}
        notifications={notifications}
        onMarkNotificationRead={onMarkNotificationRead}
        onMarkAllNotificationsRead={onMarkAllNotificationsRead}
        onLogout={onLogout}
      />

      <main
        className={cn(
          "ml-64 mt-16 flex-1 overflow-auto",
          isStudentRole &&
            "relative border-l border-white/35 bg-white/18 backdrop-blur-[1.5px]",
        )}>
        <div className={cn("p-8", isStudentRole && "relative z-10")}>
          {children}
        </div>
      </main>
    </div>
  );
}
