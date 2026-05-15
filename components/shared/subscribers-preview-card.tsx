"use client";

import { Users, ArrowUpRight } from "lucide-react";

export interface SubscriberPreviewItem {
  id: string;
  name: string;
  email?: string;
}

interface SubscribersPreviewCardProps {
  title: string;
  description: string;
  subscribers: SubscriberPreviewItem[];
  onOpen: () => void;
}

export function SubscribersPreviewCard({
  title,
  description,
  subscribers,
  onOpen,
}: SubscribersPreviewCardProps) {
  const preview = subscribers.slice(0, 4);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-primary flex-shrink-0" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center -space-x-2">
          {preview.length > 0 ? (
            preview.map((subscriber) => (
              <span
                key={subscriber.id}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-background bg-secondary text-xs font-semibold text-foreground">
                {subscriber.name.slice(0, 1).toUpperCase()}
              </span>
            ))
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
              <Users className="w-4 h-4" />
            </span>
          )}
        </div>

        <div className="text-right">
          <p className="text-xl font-bold text-foreground">
            {subscribers.length}
          </p>
          <p className="text-xs text-muted-foreground">
            {subscribers.length === 1 ? "подписчик" : "подписчиков"}
          </p>
        </div>
      </div>
    </button>
  );
}
