'use client';

import { Home, BarChart3, Award, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole, StudentView, OrganizerView } from '@/lib/types';

interface SidebarProps {
  role: UserRole;
  studentView: StudentView;
  organizerView: OrganizerView;
  onStudentViewChange: (view: StudentView) => void;
  onOrganizerViewChange: (view: OrganizerView) => void;
}

const STUDENT_ITEMS = [
  { id: 'home' as StudentView, label: 'Главная', icon: Home },
  { id: 'dashboards' as StudentView, label: 'Дашборды', icon: BarChart3 },
  { id: 'achievements' as StudentView, label: 'Достижения', icon: Award },
];

const ORGANIZER_ITEMS = [
  { id: 'events' as OrganizerView, label: 'Мероприятия', icon: CalendarDays },
];

export function Sidebar({ role, studentView, organizerView, onStudentViewChange, onOrganizerViewChange }: SidebarProps) {
  const items = role === 'student' ? STUDENT_ITEMS : ORGANIZER_ITEMS;
  const activeView = role === 'student' ? studentView : organizerView;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar flex flex-col z-20">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground leading-tight">Учёт талантов</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {role === 'student' ? 'Профиль студента' : 'Панель организатора'}
        </p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (role === 'student') onStudentViewChange(id as StudentView);
              else onOrganizerViewChange(id as OrganizerView);
            }}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
              activeView === id
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                : 'text-sidebar-foreground hover:bg-secondary'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
