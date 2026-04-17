"use client";

import { Achievement, AppNotification, Event, EventType } from "@/lib/types";
import { useMemo, useState } from "react";
import Image from "next/image";
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
  const [tab, setTab] = useState<Tab>("badges");
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
  const unlockedBadgesCount = badges.filter((badge) => badge.unlocked).length;

  const availableEventIds = useMemo(
    () => new Set(events.map((event) => event.id)),
    [events],
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-white/55 bg-white/60 p-5 shadow-[0_22px_44px_-34px_rgba(53,89,152,0.95)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="mb-1 text-3xl font-bold text-slate-900">
              Достижения
            </h2>
            <p className="text-slate-700">
              Все ваши достижения и заработанные значки
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSimulateResult}
              title="Симулировать публикацию результатов"
              aria-label="Симулировать публикацию результатов"
              className="rounded-lg border border-white/65 bg-white/70 p-2.5 text-sky-700 transition-colors hover:bg-white">
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onCreateAchievement}
              className="rounded-xl bg-[linear-gradient(135deg,#5548f3_0%,#6853ff_50%,#4d3ee7_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_-20px_rgba(78,63,226,0.95)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_38px_-18px_rgba(78,63,226,0.95)]">
              Добавить достижение
            </button>
          </div>
        </div>
      </section>

      {achievementNotifications.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-white/55 bg-white/56 p-4 shadow-[0_20px_44px_-34px_rgba(49,82,141,0.95)] backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-slate-800">
            Уведомления по достижениям
          </h3>
          <div className="space-y-2">
            {achievementNotifications.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/65 bg-white/74 p-3 shadow-[0_14px_24px_-20px_rgba(53,89,152,0.95)]">
                <div className="text-sm font-semibold text-slate-900">
                  {item.title}
                </div>
                <div className="mt-1 text-xs text-slate-700">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="inline-flex w-full gap-1 rounded-xl border border-white/55 bg-white/56 p-1.5 backdrop-blur sm:w-fit">
        {(["table", "badges"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "min-h-10 flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors",
              tab === t
                ? "bg-white text-slate-900 shadow-[0_14px_24px_-18px_rgba(44,74,136,0.95)]"
                : "text-slate-600 hover:text-slate-900",
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
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-3xl font-bold text-slate-900">Значки</h3>
              <p className="text-sm text-slate-700">
                Разблокировано {unlockedBadgesCount} из {badges.length}
              </p>
            </div>
            <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
              {visibleBadgeIds.length}/3 в визитке
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {badges.map((badge) => {
              const isVisible = visibleBadgeIds.includes(badge.id);

              return (
                <div
                  key={badge.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-4 text-center shadow-[0_20px_44px_-34px_rgba(49,82,141,0.95)] backdrop-blur-xl transition-all duration-300 md:p-5",
                    badge.unlocked
                      ? "border-white/65 bg-white/70 hover:-translate-y-1 hover:shadow-[0_28px_46px_-28px_rgba(49,82,141,0.95)]"
                      : "border-white/45 bg-white/50",
                  )}>
                  <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/60 to-transparent" />

                  {badge.unlocked ? (
                    <button
                      type="button"
                      onClick={() => onToggleBadgeVisibility(badge.id)}
                      className="absolute right-3 top-3 z-20 rounded-lg border border-white/70 bg-white/80 p-1.5 text-slate-700 transition-colors hover:bg-white"
                      title={
                        isVisible
                          ? "Скрыть значок из визитки"
                          : "Показать значок в визитке"
                      }>
                      {isVisible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  ) : (
                    <div className="absolute right-3 top-3 z-20 rounded-full border border-white/65 bg-white/82 p-1.5 text-slate-500">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="flex h-[104px] w-[104px] items-center justify-center md:h-[116px] md:w-[116px]">
                      {badge.imagePath ? (
                        <Image
                          src={badge.imagePath}
                          alt={badge.title}
                          width={116}
                          height={116}
                          className={cn(
                            "h-full w-full object-contain drop-shadow-[0_10px_18px_rgba(72,104,171,0.36)] transition-transform duration-300",
                            badge.unlocked
                              ? "group-hover:scale-[1.06]"
                              : "grayscale opacity-45",
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold",
                            badge.unlocked
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-muted-foreground",
                          )}>
                          {badge.unlocked ? (
                            badge.icon
                          ) : (
                            <Lock className="h-5 w-5" />
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-lg font-semibold leading-tight text-slate-900">
                        {badge.title}
                      </p>
                      <p className="mt-1 text-sm leading-snug text-slate-700">
                        {badge.description}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        badge.unlocked
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600",
                      )}>
                      {badge.unlocked ? "Получено" : "Не получено"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
