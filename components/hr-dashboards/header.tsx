import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HrDashboardsHeader() {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="text-3xl font-bold text-foreground">Дашборды</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Описание страницы"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground">
              <CircleHelp className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            В канбане отображаются только кандидаты, добавленные в воронку.
          </TooltipContent>
        </Tooltip>
      </div>
    </section>
  );
}
