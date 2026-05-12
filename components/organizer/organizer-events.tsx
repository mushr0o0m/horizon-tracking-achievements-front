"use client";

import { Event } from "@/lib/types";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Upload, AlertTriangle } from "lucide-react";
import {
  EVENT_LEVEL_OPTIONS,
  EVENT_LEVEL_COLORS,
  EVENT_LEVEL_LABELS,
  EVENT_STATUS_OPTIONS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_OPTIONS,
  formatEventPeriod,
} from "@/lib/event-meta";
import { cn } from "@/lib/utils";
import { EventStatusBadge } from "@/components/events/event-status-badge";

interface OrganizerEventsProps {
  events: Event[];
  onCreateEvent: () => void;
  onOpenEvent: (id: string) => void;
  onEditEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onUploadResults: (id: string) => void;
}

export function OrganizerEvents({
  events,
  onCreateEvent,
  onOpenEvent,
  onEditEvent,
  onDeleteEvent,
  onUploadResults,
}: OrganizerEventsProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !normalizedQuery ||
          event.title.toLowerCase().includes(normalizedQuery) ||
          event.description.toLowerCase().includes(normalizedQuery) ||
          (event.location ?? "").toLowerCase().includes(normalizedQuery);
        const matchesStatus = !statusFilter || event.status === statusFilter;
        const matchesType = !typeFilter || event.type === typeFilter;
        const matchesLevel = !levelFilter || event.level === levelFilter;

        return matchesSearch && matchesStatus && matchesType && matchesLevel;
      }),
    [events, searchQuery, statusFilter, typeFilter, levelFilter],
  );

  const handleDeleteConfirm = (id: string) => {
    onDeleteEvent(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Мероприятия</h2>
          <p className="text-muted-foreground mt-1">
            Управление мероприятиями и результатами
          </p>
        </div>
        <button
          onClick={onCreateEvent}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
          <Plus className="w-4 h-4" />
          Создать мероприятие
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, описанию, локации"
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
            <option value="">Все статусы</option>
            {EVENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
            <option value="">Все типы</option>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm">
            <option value="">Все уровни</option>
            {EVENT_LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
                <p className="font-semibold text-foreground">
                  Удалить мероприятие?
                </p>
                <p className="text-sm text-muted-foreground">
                  Это действие необратимо.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-colors">
                Отмена
              </button>
              <button
                onClick={() => handleDeleteConfirm(deleteConfirmId)}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredEvents.length === 0 ? (
        <div className="bg-card border border-border rounded-lg py-16 text-center">
          <p className="text-muted-foreground">
            Нет мероприятий по текущим фильтрам.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                    Название
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                    Тип
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                    Уровень
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                    Период
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                    Статус
                  </th>
                  <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                    Участников
                  </th>
                  <th className="px-5 py-3 text-right text-sm font-semibold text-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => onOpenEvent(event.id)}
                    className="border-b border-border hover:bg-secondary/40 transition-colors cursor-pointer">
                    <td className="px-5 py-4 text-sm font-medium text-foreground max-w-xs">
                      <div className="truncate">{event.title}</div>
                      {event.description.trim() && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {EVENT_TYPE_LABELS[event.type]}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          EVENT_LEVEL_COLORS[event.level],
                        )}>
                        {EVENT_LEVEL_LABELS[event.level]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {formatEventPeriod(event)}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <EventStatusBadge status={event.status} />
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {event.participantsCount}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUploadResults(event.id);
                          }}
                          title="Загрузить результаты"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditEvent(event.id);
                          }}
                          title="Редактировать"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(event.id);
                          }}
                          title="Удалить"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
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
