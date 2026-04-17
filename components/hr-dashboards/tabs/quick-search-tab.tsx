import { ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickSearchRow } from "@/components/hr-dashboards/types";

interface HrQuickSearchTabProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  quickSearchRows: QuickSearchRow[];
  paginatedQuickSearchRows: QuickSearchRow[];
  safeQuickSearchPage: number;
  quickSearchPageCount: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenCandidate: (candidateId: string) => void;
}

export function HrQuickSearchTab({
  searchQuery,
  onSearchQueryChange,
  quickSearchRows,
  paginatedQuickSearchRows,
  safeQuickSearchPage,
  quickSearchPageCount,
  onPrevPage,
  onNextPage,
  onOpenCandidate,
}: HrQuickSearchTabProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <section className="bg-card border border-border rounded-xl p-4">
        <label className="block space-y-1.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Например: Иванов, ИТМО, информатика"
              className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </label>
      </section>

      <section className="flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {quickSearchRows.length > 0 ? (
          <div className="h-full overflow-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Кандидат</th>
                  <th className="px-4 py-3 font-medium">Учеба</th>
                  <th className="px-4 py-3 font-medium">Достижения</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuickSearchRows.map((item) => (
                  <tr
                    key={`${item.status}-${item.id}`}
                    className="group border-b border-border/60 align-top last:border-b-0">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onOpenCandidate(item.id)}
                        className="text-left text-foreground hover:text-primary transition-colors">
                        <p className="font-semibold flex items-center gap-2">
                          {item.name}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </p>
                        <p className="text-muted-foreground mt-1">
                          {item.email || "Email не указан"}
                        </p>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>{item.university || "Вуз не указан"}</p>
                      <p>{item.faculty || "Факультет не указан"}</p>
                      <p>{item.course}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <p>
                        Всего:{" "}
                        <span className="text-foreground">
                          {item.totalAchievements}
                        </span>
                      </p>
                      <p>
                        Подтверждено:{" "}
                        <span className="text-foreground">
                          {item.confirmedAchievements}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenCandidate(item.id)}>
                          Профиль
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
          Показано {paginatedQuickSearchRows.length} из {quickSearchRows.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrevPage}
            disabled={safeQuickSearchPage <= 1}>
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {safeQuickSearchPage} из {quickSearchPageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={safeQuickSearchPage >= quickSearchPageCount}>
            Вперед
          </Button>
        </div>
      </section>
    </div>
  );
}
