"use client";

import { AuthUser, UserRole } from "@/lib/types";
import { Building2, LogOut, User } from "lucide-react";

interface TopBarProps {
  role: UserRole;
  user: AuthUser;
  onLogout: () => void;
}

export function TopBar({ role, user, onLogout }: TopBarProps) {
  return (
    <div className="fixed top-0 left-64 right-0 h-16 border-b border-border bg-background flex items-center justify-between px-8 z-10">
      <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm">
        {role === "student" ? (
          <User className="w-4 h-4" />
        ) : (
          <Building2 className="w-4 h-4" />
        )}
        <span className="font-medium text-foreground">
          {role === "student" ? "Студент" : "Организатор"}
        </span>
      </div>

      <div className="flex items-center gap-3">
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
