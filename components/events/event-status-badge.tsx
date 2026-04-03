"use client";

import { OrganizerEventStatus } from "@/lib/types";
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS } from "@/lib/event-meta";
import { cn } from "@/lib/utils";

interface EventStatusBadgeProps {
  status: OrganizerEventStatus;
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        EVENT_STATUS_COLORS[status],
      )}>
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}
