import { STATUS_UPDATE_FILTER_OPTIONS } from "@/components/hr/dashboards/constants";
import { StatusUpdateWindow } from "@/components/hr/dashboards/types";
import { cn } from "@/lib/utils";

interface StatusWindowSelectProps {
  value: StatusUpdateWindow;
  onChange: (value: StatusUpdateWindow) => void;
  label?: string;
  className?: string;
}

export function StatusWindowSelect({
  value,
  onChange,
  label = "Последнее обновление статуса",
  className,
}: StatusWindowSelectProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}>
      {label ? <span>{label}</span> : null}
      <select
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value) as StatusUpdateWindow)
        }
        className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
        {STATUS_UPDATE_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
