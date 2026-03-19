'use client';

import { CURRENT_STUDENT } from '@/lib/data';
import { UserRole } from '@/lib/types';
import { User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopBarProps {
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export function TopBar({ role, onRoleChange }: TopBarProps) {
  return (
    <div className="fixed top-0 left-64 right-0 h-16 border-b border-border bg-background flex items-center justify-between px-8 z-10">
      {/* Role Switcher */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onRoleChange('student')}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            role === 'student'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <User className="w-4 h-4" />
          Студент
        </button>
        <button
          onClick={() => onRoleChange('organizer')}
          className={cn(
            'flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            role === 'organizer'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Building2 className="w-4 h-4" />
          Организатор
        </button>
      </div>

      {/* Student info (student role only) */}
      {role === 'student' && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-semibold text-foreground text-sm">{CURRENT_STUDENT.name}</div>
            <div className="text-xs text-muted-foreground">{CURRENT_STUDENT.faculty}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {CURRENT_STUDENT.name[0]}
          </div>
        </div>
      )}
    </div>
  );
}
