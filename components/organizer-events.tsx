'use client';

import { Event, EventType, AchievementLevel } from '@/lib/types';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Upload, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizerEventsProps {
  events: Event[];
  onCreateEvent: () => void;
  onEditEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onUploadResults: (id: string) => void;
}

const LEVEL_COLORS: Record<AchievementLevel, string> = {
  'Международный': 'bg-purple-100 text-purple-700',
  'Всероссийский': 'bg-blue-100 text-blue-700',
  'Региональный': 'bg-cyan-100 text-cyan-700',
  'Вузовский': 'bg-green-100 text-green-700',
  'Факультетский': 'bg-gray-100 text-gray-700',
};

export function OrganizerEvents({ events, onCreateEvent, onEditEvent, onDeleteEvent, onUploadResults }: OrganizerEventsProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteConfirm = (id: string) => {
    onDeleteEvent(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Мероприятия</h2>
          <p className="text-muted-foreground mt-1">Управление мероприятиями и результатами</p>
        </div>
        <button
          onClick={onCreateEvent}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Создать мероприятие
        </button>
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-card border border-border rounded-xl p-6 shadow-xl w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Удалить мероприятие?</p>
                <p className="text-sm text-muted-foreground">Это действие необратимо.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="bg-card border border-border rounded-lg py-16 text-center">
          <p className="text-muted-foreground">Нет мероприятий. Создайте первое!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Название</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Тип</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Уровень</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Дата</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Статус</th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">Участников</th>
                  <th className="px-5 py-3 text-right text-sm font-semibold text-foreground">Действия</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} className="border-b border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-foreground max-w-xs">
                      <div className="truncate">{event.title}</div>
                      {event.description && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">{event.description}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{event.type}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', LEVEL_COLORS[event.level])}>
                        {event.level}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-medium',
                        event.status === 'Опубликовано'
                          ? 'bg-[var(--verified-bg)] text-[var(--verified)]'
                          : 'bg-[var(--pending-bg)] text-[var(--pending)]'
                      )}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{event.participantCount}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => onUploadResults(event.id)}
                          title="Загрузить результаты"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditEvent(event.id)}
                          title="Редактировать"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(event.id)}
                          title="Удалить"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
