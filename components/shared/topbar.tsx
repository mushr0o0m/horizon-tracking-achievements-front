"use client";

import { AppNotification, AuthUser, UserRole } from "@/lib/types";
import { Building2, LogOut, User, Bell, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  role: UserRole;
  user: AuthUser;
  notifications: AppNotification[];
  onMarkNotificationRead: (notificationId: string) => void;
  onMarkAllNotificationsRead: () => void;
  onLogout: () => void;
}

export function TopBar({
  role,
  user,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onLogout,
}: TopBarProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readAllClickedAt, setReadAllClickedAt] = useState<number | null>(null);
  const isStudent = role === "student";

  const visibleNotifications = useMemo(() => {
    if (readAllClickedAt === null) {
      return notifications;
    }
    return notifications.map((item) =>
      new Date(item.createdAt).getTime() <= readAllClickedAt
        ? { ...item, isRead: true }
        : item,
    );
  }, [notifications, readAllClickedAt]);

  const latestNotifications = useMemo(
    () => visibleNotifications.slice(0, 10),
    [visibleNotifications],
  );
  const unreadCount = visibleNotifications.filter((item) => !item.isRead).length;

  const handleMarkAll = () => {
    setReadAllClickedAt(Date.now());
    onMarkAllNotificationsRead();
  };

  useEffect(() => {
    if (readAllClickedAt === null) return;
    if (!notifications.every((item) => item.isRead)) return;
    setReadAllClickedAt(null);
  }, [notifications, readAllClickedAt]);

  return (
    <div
      className={cn(
        "fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between px-8",
        isStudent
          ? "border-b border-white/45 bg-white/44 backdrop-blur-xl shadow-[0_18px_42px_-34px_rgba(29,55,108,0.9)]"
          : "border-b border-border bg-background",
      )}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
          isStudent
            ? "border-white/65 bg-white/68 text-slate-800"
            : "border-border bg-secondary/60",
        )}>
        {role === "student" ? (
          <User className="w-4 h-4" />
        ) : role === "organizer" ? (
          <Building2 className="w-4 h-4" />
        ) : (
          <UsersRound className="w-4 h-4" />
        )}
        <span className="font-medium text-foreground">
          {role === "student"
            ? "Ученик"
            : role === "organizer"
              ? "Организатор"
              : "HR"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className={cn(
              "relative rounded-lg border p-2 transition-colors",
              isStudent
                ? "border-white/60 bg-white/62 hover:bg-white/80"
                : "border-border hover:bg-secondary",
            )}
            aria-label="Уведомления">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-5 text-center">
                {Math.min(unreadCount, 99)}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              className={cn(
                "absolute right-0 z-[120] mt-2 w-[360px] max-w-[80vw] rounded-xl border shadow-xl",
                isStudent
                  ? "border-white/70 bg-white/88 backdrop-blur-2xl"
                  : "border-border bg-background",
              )}>
              <div
                className={cn(
                  "flex items-center justify-between border-b px-4 py-3",
                  isStudent ? "border-white/60" : "border-border",
                )}>
                <p className="text-sm font-semibold text-foreground">
                  Уведомления
                </p>
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-xs text-primary hover:underline">
                  Прочитать все
                </button>
              </div>

              {latestNotifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                  Пока нет уведомлений
                </div>
              ) : (
                <div className="max-h-[360px] overflow-auto">
                  {latestNotifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onMarkNotificationRead(item.id)}
                      className={cn(
                        "w-full border-b px-4 py-3 text-left transition-colors last:border-b-0",
                        isStudent
                          ? "border-white/45 hover:bg-white"
                          : "border-border hover:bg-secondary/60",
                      )}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(item.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-right hidden sm:block">
          <div className="font-semibold text-foreground text-sm">
            {user.name}
          </div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
            isStudent
              ? "bg-gradient-to-br from-cyan-500 to-sky-600 text-white shadow-[0_10px_24px_-14px_rgba(6,92,149,0.9)]"
              : "bg-primary text-primary-foreground",
          )}>
          {user.name[0]}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
            isStudent
              ? "border-white/60 bg-white/64 text-slate-700 hover:bg-white/85 hover:text-slate-900"
              : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
          )}>
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </div>
  );
}
