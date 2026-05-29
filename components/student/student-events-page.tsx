"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import type {
  Event,
  OrganizerEventLevel,
  OrganizerEventType,
} from "@/lib/types";
import {
  EVENT_FORMAT_OPTIONS,
  EVENT_LEVEL_LABELS,
  EVENT_LEVEL_OPTIONS,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_OPTIONS,
  formatEventPeriod,
} from "@/lib/event-meta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type StudentEventsTab = "table" | "recommended";

interface StudentEventsPageProps {
  events: Event[];
  recommendedEvents: Event[];
  activeTab: StudentEventsTab;
  onTabChange: (tab: StudentEventsTab) => void;
  onOpenEvent: (eventId: string) => void;
  filtersState?: StudentEventsFiltersState;
  onFiltersStateChange?: (nextState: StudentEventsFiltersState) => void;
}

type SortField = "title" | "date" | "level";
type SortOrder = "asc" | "desc";

export interface StudentEventsFiltersState {
  searchQuery: string;
  selectedType: OrganizerEventType | "";
  selectedLevel: OrganizerEventLevel | "";
  sortField: SortField;
  sortOrder: SortOrder;
}

function isSameFiltersState(
  left: StudentEventsFiltersState,
  right: StudentEventsFiltersState,
): boolean {
  return (
    left.searchQuery === right.searchQuery &&
    left.selectedType === right.selectedType &&
    left.selectedLevel === right.selectedLevel &&
    left.sortField === right.sortField &&
    left.sortOrder === right.sortOrder
  );
}

export function StudentEventsPage({
  events,
  recommendedEvents,
  activeTab,
  onTabChange,
  onOpenEvent,
  filtersState,
  onFiltersStateChange,
}: StudentEventsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<OrganizerEventType | "">("");
  const [selectedLevel, setSelectedLevel] = useState<OrganizerEventLevel | "">(
    "",
  );
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    if (!filtersState) return;
    if (searchQuery !== filtersState.searchQuery) {
      setSearchQuery(filtersState.searchQuery);
    }
    if (selectedType !== filtersState.selectedType) {
      setSelectedType(filtersState.selectedType);
    }
    if (selectedLevel !== filtersState.selectedLevel) {
      setSelectedLevel(filtersState.selectedLevel);
    }
    if (sortField !== filtersState.sortField) {
      setSortField(filtersState.sortField);
    }
    if (sortOrder !== filtersState.sortOrder) {
      setSortOrder(filtersState.sortOrder);
    }
  }, [
    filtersState,
    searchQuery,
    selectedLevel,
    selectedType,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    const nextState: StudentEventsFiltersState = {
      searchQuery,
      selectedType,
      selectedLevel,
      sortField,
      sortOrder,
    };
    if (filtersState && isSameFiltersState(filtersState, nextState)) {
      return;
    }
    onFiltersStateChange?.(nextState);
  }, [
    filtersState,
    onFiltersStateChange,
    searchQuery,
    selectedLevel,
    selectedType,
    sortField,
    sortOrder,
  ]);

  const levelOrder = useMemo(
    () =>
      new Map(
        EVENT_LEVEL_OPTIONS.map((option, index) => [option.value, index]),
      ),
    [],
  );

  const filteredEvents = useMemo(() => {
    let data = events.filter((event) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !normalizedQuery ||
        event.title.toLowerCase().includes(normalizedQuery) ||
        event.description.toLowerCase().includes(normalizedQuery) ||
        (event.location ?? "").toLowerCase().includes(normalizedQuery);
      const matchesType = !selectedType || event.type === selectedType;
      const matchesLevel = !selectedLevel || event.level === selectedLevel;
      return matchesSearch && matchesType && matchesLevel;
    });

    data.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      if (sortField === "date") {
        aVal = new Date(a.dates.start).getTime();
        bVal = new Date(b.dates.start).getTime();
      } else if (sortField === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else {
        aVal = levelOrder.get(a.level) ?? 0;
        bVal = levelOrder.get(b.level) ?? 0;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [
    events,
    levelOrder,
    searchQuery,
    selectedLevel,
    selectedType,
    sortField,
    sortOrder,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 inline" />
    ) : (
      <ChevronDown className="w-4 h-4 inline" />
    );
  };

  const renderSortableHeader = (label: string, field: SortField) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="inline-flex items-center gap-1 hover:text-foreground/80 transition-colors">
      {label}
      <SortIcon field={field} />
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-white/55 bg-white/60 p-5 shadow-[0_22px_44px_-34px_rgba(53,89,152,0.95)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="mb-1 text-3xl font-bold text-slate-900">
              Мероприятия
            </h2>
            <p className="text-slate-700">
              Подборка актуальных мероприятий, доступных для участия
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
            <CalendarDays className="h-4 w-4 text-sky-600" />
            {events.length} доступно
          </div>
        </div>
      </section>

      <div className="inline-flex w-full gap-1 rounded-xl border border-white/55 bg-white/56 p-1.5 backdrop-blur sm:w-fit">
        {(["table", "recommended"] as StudentEventsTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={cn(
              "min-h-10 flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors",
              activeTab === tab
                ? "bg-white text-slate-900 shadow-[0_14px_24px_-18px_rgba(44,74,136,0.95)]"
                : "text-slate-600 hover:text-slate-900",
            )}>
            {tab === "table" ? "Таблица" : "Рекомендованные мероприятия"}
          </button>
        ))}
      </div>

      {activeTab === "table" && (
        <>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск по названию"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) =>
                  setSelectedType(e.target.value as OrganizerEventType | "")
                }
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-sm">
                <option value="">Все типы</option>
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) =>
                  setSelectedLevel(e.target.value as OrganizerEventLevel | "")
                }
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-sm">
                <option value="">Все уровни</option>
                {EVENT_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      {renderSortableHeader("Название", "title")}
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      Тип
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      {renderSortableHeader("Уровень", "level")}
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      {renderSortableHeader("Дата начала", "date")}
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      Регистрация до
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <tr
                        key={event.id}
                        onClick={() => onOpenEvent(event.id)}
                        className="border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                        <td className="px-5 py-4 text-sm font-medium text-foreground">
                          {event.title}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {EVENT_TYPE_LABELS[event.type]}
                        </td>
                        <td className="px-5 py-4 text-sm text-foreground">
                          {EVENT_LEVEL_LABELS[event.level]}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {new Date(event.dates.start).toLocaleDateString(
                            "ru-RU",
                          )}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {new Date(
                            event.dates.registrationDeadline,
                          ).toLocaleDateString("ru-RU")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-muted-foreground">
                        Нет мероприятий, соответствующих фильтрам
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "recommended" && (
        <section className="rounded-2xl border border-white/55 bg-white/60 p-4 shadow-[0_20px_44px_-34px_rgba(49,82,141,0.95)] backdrop-blur-xl md:p-6">
          {recommendedEvents.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {recommendedEvents.map((event) => {
                const formatLabel =
                  EVENT_FORMAT_OPTIONS.find(
                    (option) => option.value === event.format,
                  )?.label ?? "";

                return (
                  <AccordionItem key={event.id} value={event.id}>
                    <AccordionTrigger className="rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-900 hover:no-underline">
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-semibold text-slate-900">
                          {event.title}
                        </span>
                        <span className="text-xs text-slate-600">
                          {EVENT_TYPE_LABELS[event.type]} ·{" "}
                          {EVENT_LEVEL_LABELS[event.level]} ·{" "}
                          {formatEventPeriod(event)}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3">
                      <div className="grid gap-3 rounded-xl border border-white/60 bg-white/75 p-4 text-sm text-slate-700">
                        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                          <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1">
                            Формат: {formatLabel || "—"}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1">
                            Регистрация до:{" "}
                            {new Date(
                              event.dates.registrationDeadline,
                            ).toLocaleDateString("ru-RU")}
                          </span>
                          {event.location && (
                            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1">
                              Локация: {event.location}
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-slate-700">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                          <span>Контакт: {event.contactEmail || "—"}</span>
                          <button
                            type="button"
                            onClick={() => onOpenEvent(event.id)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Открыть карточку
                          </button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="rounded-2xl border border-white/60 bg-white/70 py-10 text-center text-slate-600">
              Сейчас нет рекомендованных мероприятий
            </div>
          )}
        </section>
      )}
    </div>
  );
}
