"use client";

import { ArrowLeft, Building2, Mail, UserRound } from "lucide-react";
import { SubscriberPreviewItem } from "@/components/shared/subscribers-preview-card";

interface SubscribersPageProps {
  title: string;
  subtitle: string;
  subscribers: SubscriberPreviewItem[];
  onBack: () => void;
  onOpenSubscriber: (hrId: string) => void;
}

export function SubscribersPage({
  title,
  subtitle,
  subscribers,
  onBack,
  onOpenSubscriber,
}: SubscribersPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div>
          <h2 className="text-3xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </section>

      {subscribers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {subscribers.map((subscriber) => (
            <button
              key={subscriber.id}
              type="button"
              onClick={() => onOpenSubscriber(subscriber.id)}
              className="text-left rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground font-semibold">
                  {subscriber.name.slice(0, 1).toUpperCase()}
                </span>
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{subscriber.name}</p>
              <p className="text-sm text-muted-foreground inline-flex items-center gap-2 break-all">
                <Mail className="w-4 h-4 flex-shrink-0" />
                {subscriber.email || "Email не указан"}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
          <div className="inline-flex items-center gap-2 text-sm">
            <UserRound className="w-4 h-4" />
            Подписчиков пока нет
          </div>
        </div>
      )}
    </div>
  );
}
