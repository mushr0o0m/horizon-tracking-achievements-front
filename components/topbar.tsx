"use client";

import { AppNotification, AuthUser, UserRole } from "@/lib/types";
import { Building2, LogOut, User, Bell } from "lucide-react";
import { useMemo, useState } from "react";

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

  const latestNotifications = useMemo(
    () => notifications.slice(0, 10),
    [notifications],
  );
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="fixed top-0 left-64 right-0 h-16 border-b border-border bg-background flex items-center justify-between px-8 z-30">
      <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm">
        {role === "student" ? (
          <User className="w-4 h-4" />
        ) : (
          <Building2 className="w-4 h-4" />
        )}
        <span className="font-medium text-foreground">
          {role === "student" ? "Ученик" : "Организатор"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            aria-label="Уведомления">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-5 text-center">
                {Math.min(unreadCount, 99)}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-[360px] max-w-[80vw] bg-background border border-border rounded-xl shadow-xl z-[120]">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Уведомления
                </p>
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
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
                      className="w-full px-4 py-3 border-b border-border last:border-b-0 text-left hover:bg-secondary/60 transition-colors">
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
        <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
          {user.name[0]}
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <LogOut className="w-4 h-4" />
          Выйти
        </button>
      </div>
    </div>
  );
}
