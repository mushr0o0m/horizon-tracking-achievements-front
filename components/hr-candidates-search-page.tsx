"use client";

import { useMemo, useState } from "react";
import { Search, ArrowUpRight, PlusCircle, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HR_FUNNEL_STATUSES, HrFunnelStatus } from "@/lib/hr-funnel";

export interface HrCandidateSummary {
  id: string;
  name: string;
  email: string;
  university: string;
  faculty: string;
  course: string;
  totalAchievementsCount: number;
  confirmedAchievementsCount: number;
  candidateStatus: HrFunnelStatus;
}

interface HrCandidatesSearchPageProps {
  candidates: HrCandidateSummary[];
  onAddToFunnel: (candidateId: string) => string | null;
  onOpenCandidate: (candidateId: string) => void;
}

type SortColumn = "candidate" | "study" | "achievements";
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

function formatCourseLabel(rawCourse: string): string {
  if (!rawCourse) return "Курс не указан";

  const specialMap: Record<string, string> = {
    graduate: "Выпускник",
    magister: "Магистр",
    postgraduate: "Аспирант",
  };

  if (specialMap[rawCourse]) return specialMap[rawCourse];
  return `${rawCourse} курс`;
}

function getCandidateStatusClasses(status: HrFunnelStatus): string {
  if (status === "Не отслеживается") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }
  if (status === "На рассмотрении") {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  if (status === "Интересует") {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }
  if (status === "Приглашён") {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  if (status === "Ответили на приглашение") {
    return "border-indigo-200 bg-indigo-100 text-indigo-700";
  }
  return "border-rose-200 bg-rose-100 text-rose-700";
}

export function HrCandidatesSearchPage({
  candidates,
  onAddToFunnel,
  onOpenCandidate,
}: HrCandidatesSearchPageProps) {
  const [query, setQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedStatuses, setSelectedStatuses] = useState<HrFunnelStatus[]>(
    [],
  );
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<string | null>(null);
  const pageSize = 12;

  const universityOptions = useMemo(() => {
    const set = new Set<string>();

    candidates.forEach((candidate) => {
      const normalized = candidate.university.trim();
      if (normalized) {
        set.add(normalized);
      }
    });

    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [candidates]);

  const selectedStatusesLabel =
    selectedStatuses.length === 0
      ? "Все статусы"
      : selectedStatuses.length === 1
        ? selectedStatuses[0]
        : `Выбрано: ${selectedStatuses.length}`;

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const byUniversity =
        selectedUniversity === "all" ||
        (selectedUniversity === "none"
          ? !candidate.university.trim()
          : candidate.university.trim() === selectedUniversity);
      if (!byUniversity) return false;

      const byStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(candidate.candidateStatus);
      if (!byStatus) return false;

      const haystack = [
        candidate.name,
        candidate.email,
        candidate.university,
        candidate.faculty,
        candidate.course,
      ]
        .join(" ")
        .toLowerCase();
      return !normalizedQuery || haystack.includes(normalizedQuery);
    });
  }, [candidates, query, selectedUniversity, selectedStatuses]);

  const sortedCandidates = useMemo(() => {
    if (!sortState) return filteredCandidates;

    const collator = new Intl.Collator("ru", {
      sensitivity: "base",
      numeric: true,
    });
    const sorted = [...filteredCandidates].sort((a, b) => {
      if (sortState.column === "candidate") {
        return (
          collator.compare(a.name, b.name) || collator.compare(a.email, b.email)
        );
      }

      if (sortState.column === "study") {
        const left = [a.university, a.faculty, formatCourseLabel(a.course)].join(
          " ",
        );
        const right = [
          b.university,
          b.faculty,
          formatCourseLabel(b.course),
        ].join(" ");
        return collator.compare(left, right);
      }

      return (
        a.totalAchievementsCount - b.totalAchievementsCount ||
        a.confirmedAchievementsCount - b.confirmedAchievementsCount
      );
    });

    return sortState.direction === "asc" ? sorted : sorted.reverse();
  }, [filteredCandidates, sortState]);

  const pageCount = Math.max(1, Math.ceil(sortedCandidates.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginatedCandidates = sortedCandidates.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const handleSortToggle = (column: SortColumn) => {
    setPage(1);
    setSortState((prev) => {
      if (!prev || prev.column !== column) {
        return { column, direction: "asc" };
      }

      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }

      return null;
    });
  };

  const getSortLabel = (column: SortColumn): string => {
    if (!sortState || sortState.column !== column) return "↕";
    return sortState.direction === "asc" ? "↑" : "↓";
  };

  const handleAddToFunnel = (candidateId: string) => {
    const result = onAddToFunnel(candidateId);
    setFeedback(result ?? "Кандидат добавлен в колонку «На рассмотрении». ");
  };

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[560px] flex-col gap-4 overflow-hidden">
      <section className="space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Поиск кандидатов</h2>
        <p className="text-muted-foreground">
          Таблица кандидатов с пагинацией и быстрым добавлением в воронку.
        </p>
      </section>

      <section className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
                setFeedback(null);
              }}
              placeholder="Например: Иванов, ИТМО, информатика"
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={selectedUniversity}
            onChange={(event) => {
              setSelectedUniversity(event.target.value);
              setPage(1);
            }}
            className="min-w-[220px] cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="all">Все вузы</option>
            <option value="none">Вуз не указан</option>
            {universityOptions.map((university) => (
              <option key={university} value={university}>
                {university}
              </option>
            ))}
          </select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="min-w-[220px] justify-start">
                {selectedStatusesLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Фильтр по статусу</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {HR_FUNNEL_STATUSES.map((status) => {
                const checked = selectedStatuses.includes(status);

                return (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={checked}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={() => {
                      setSelectedStatuses((prev) => {
                        const next = prev.includes(status)
                          ? prev.filter((item) => item !== status)
                          : [...prev, status];
                        return next;
                      });
                      setPage(1);
                    }}>
                    {status}
                  </DropdownMenuCheckboxItem>
                );
              })}
              <DropdownMenuSeparator />
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-sm"
                onClick={() => {
                  setSelectedStatuses([]);
                  setPage(1);
                }}>
                Сбросить статусы
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {feedback && (
          <p className="mt-2 text-sm text-muted-foreground">{feedback}</p>
        )}
      </section>

      <section className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {filteredCandidates.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSortToggle("candidate")}
                      className="inline-flex cursor-pointer items-center gap-1.5">
                      <span>Кандидат</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="text-xs">{getSortLabel("candidate")}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSortToggle("study")}
                      className="inline-flex cursor-pointer items-center gap-1.5">
                      <span>Учеба</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="text-xs">{getSortLabel("study")}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => handleSortToggle("achievements")}
                      className="inline-flex cursor-pointer items-center gap-1.5">
                      <span>Достижения</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="text-xs">
                        {getSortLabel("achievements")}
                      </span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCandidates.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="border-b border-border/60 align-top last:border-b-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onOpenCandidate(candidate.id)}
                        className="text-left text-foreground hover:text-primary transition-colors">
                        <p className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCandidateStatusClasses(
                              candidate.candidateStatus,
                            )}`}>
                            {candidate.candidateStatus}
                          </span>
                        </p>
                        <p className="mt-1 font-semibold flex items-center gap-2">
                          {candidate.name}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </p>
                        <p className="text-muted-foreground mt-1">
                          {candidate.email}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{candidate.university || "Вуз не указан"}</p>
                      <p>{candidate.faculty || "Факультет не указан"}</p>
                      <p>{formatCourseLabel(candidate.course)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>
                        Всего:{" "}
                        <span className="text-foreground">
                          {candidate.totalAchievementsCount}
                        </span>
                      </p>
                      <p>
                        Подтверждено:{" "}
                        <span className="text-foreground">
                          {candidate.confirmedAchievementsCount}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={candidate.candidateStatus !== "Не отслеживается"}
                          onClick={() => handleAddToFunnel(candidate.id)}>
                          <PlusCircle className="mr-1.5 w-4 h-4" />В воронку
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-muted-foreground px-6 text-center">
            По вашему запросу кандидаты не найдены
          </div>
        )}
      </section>

      <section className="flex items-center justify-between border border-border rounded-xl bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Показано {paginatedCandidates.length} из {sortedCandidates.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={safePage <= 1}>
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {safePage} из {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={safePage >= pageCount}>
            Вперед
          </Button>
        </div>
      </section>
    </div>
  );
}
