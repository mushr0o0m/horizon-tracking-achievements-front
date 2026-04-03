"use client";

import { Achievement, AppNotification, Event, EventType } from "@/lib/types";
import { useMemo, useState } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  Lock,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildBadgeViewModels } from "@/lib/badges";

interface AchievementsPageProps {
  achievements: Achievement[];
  events: Event[];
  onOpenEvent: (eventId: string) => void;
  onOpenAchievement: (achievementId: string) => void;
  onCreateAchievement: () => void;
  onSimulateResult: () => void;
  achievementNotifications: AppNotification[];
  visibleBadgeIds: string[];
  onToggleBadgeVisibility: (badgeId: string) => void;
}

type SortField = "title" | "date" | "level";
type SortOrder = "asc" | "desc";
type Tab = "table" | "badges";

const EVENT_TYPES: EventType[] = [
  "Олимпиада",
  "Конкурс",
  "Хакатон",
  "Конференция",
  "Чемпионат",
  "Другое",
];

export function AchievementsPage({
  achievements,
  events,
  onOpenEvent,
  onOpenAchievement,
  onCreateAchievement,
  onSimulateResult,
  achievementNotifications,
  visibleBadgeIds,
  onToggleBadgeVisibility,
}: AchievementsPageProps) {
  const [tab, setTab] = useState<Tab>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedEventType, setSelectedEventType] = useState<EventType | "">(
    "",
  );
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredData = useMemo(() => {
    let data = achievements.filter((a) => {
      const matchesSearch = a.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const year = new Date(a.date).getFullYear().toString();
      const matchesYear = !selectedYear || year === selectedYear;
      const matchesEventType =
        !selectedEventType || a.eventType === selectedEventType;
      return matchesSearch && matchesYear && matchesEventType;
    });

    data.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortField === "date") {
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
      } else if (sortField === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else {
        aVal = a.level;
        bVal = b.level;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [
    searchQuery,
    selectedYear,
    selectedEventType,
    sortField,
    sortOrder,
    achievements,
  ]);

  const years = Array.from(
    new Set(achievements.map((a) => new Date(a.date).getFullYear().toString())),
  )
    .sort()
    .reverse();

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
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

  const badges = buildBadgeViewModels(achievements);

  const availableEventIds = useMemo(
    () => new Set(events.map((event) => event.id)),
    [events],
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-1">
              Достижения
            </h2>
            <p className="text-muted-foreground">
              Все ваши достижения и заработанные значки
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSimulateResult}
              title="Симулировать публикацию результатов"
              aria-label="Симулировать публикацию результатов"
              className="p-2.5 rounded-lg border border-border hover:bg-secondary transition-colors text-primary">
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCreateAchievement}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
              Добавить достижение
            </button>
          </div>
        </div>
      </section>

      {achievementNotifications.length > 0 && (
        <section className="bg-card border border-border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Уведомления по достижениям
          </h3>
          <div className="space-y-2">
            {achievementNotifications.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="border border-border rounded-lg p-3 bg-secondary/30">
                <div className="text-sm font-medium text-foreground">
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {(["table", "badges"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 rounded-md text-sm font-medium transition-colors",
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}>
            {t === "table" ? "Таблица" : "Значки"}
          </button>
        ))}
      </div>

      {tab === "table" && (
        <>
          {/* Filters */}
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
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-sm">
                <option value="">Все годы</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={selectedEventType}
                onChange={(e) =>
                  setSelectedEventType(e.target.value as EventType | "")
                }
                className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer text-sm">
                <option value="">Все типы</option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th
                      className="px-5 py-3 text-left text-sm font-semibold text-foreground cursor-pointer"
                      onClick={() => handleSort("title")}>
                      Название <SortIcon field="title" />
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      Тип мероприятия
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      Уровень
                    </th>
                    <th
                      className="px-5 py-3 text-left text-sm font-semibold text-foreground cursor-pointer"
                      onClick={() => handleSort("date")}>
                      Год <SortIcon field="date" />
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      Результат
                    </th>
                    <th className="px-5 py-3 text-left text-sm font-semibold text-foreground">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => onOpenAchievement(a.id)}
                        className="border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                        <td className="px-5 py-4 text-sm font-medium text-foreground">
                          {a.title}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {a.eventType ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-foreground">
                          {a.level}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {new Date(a.date).getFullYear()}
                        </td>
                        <td className="px-5 py-4 text-sm text-foreground">
                          {a.result}
                        </td>
                        <td className="px-5 py-4 text-sm">
                          {a.status === "Подтверждено" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--verified-bg)] text-[var(--verified)]">
                              Подтверждено
                            </span>
                          ) : a.status === "Отклонено" ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/15 text-destructive">
                              Отклонено
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--pending-bg)] text-[var(--pending)]">
                              На проверке
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-muted-foreground">
                        Нет достижений, соответствующих фильтрам
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "badges" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "bg-card border rounded-xl p-5 flex flex-col items-center text-center gap-3 transition-all",
                badge.unlocked
                  ? "border-primary/30 shadow-sm"
                  : "border-border opacity-50 grayscale",
              )}>
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold",
                  badge.unlocked
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-muted-foreground",
                )}>
                {badge.unlocked ? badge.icon : <Lock className="w-5 h-5" />}
              </div>
              <button
                type="button"
                onClick={() =>
                  badge.unlocked && onToggleBadgeVisibility(badge.id)
                }
                className={cn(
                  "p-1.5 rounded-md border border-border",
                  badge.unlocked
                    ? "hover:bg-secondary text-foreground"
                    : "opacity-50 cursor-not-allowed text-muted-foreground",
                )}
                title={
                  badge.unlocked
                    ? visibleBadgeIds.includes(badge.id)
                      ? "Скрыть значок из визитки"
                      : "Показать значок в визитке"
                    : "Значок не разблокирован"
                }>
                {visibleBadgeIds.includes(badge.id) ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {badge.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {badge.description}
                </p>
              </div>
              {badge.unlocked && (
                <span className="text-xs font-medium text-[var(--verified)] bg-[var(--verified-bg)] px-2.5 py-0.5 rounded-full">
                  Получено
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
