"use client";

import { AuthUser } from "@/lib/types";
import { ArrowLeft, Building2, Globe, Mail, Phone } from "lucide-react";

interface HrPublicProfilePageProps {
  hrUser: AuthUser | null;
  onBack: () => void;
}

export function HrPublicProfilePage({
  hrUser,
  onBack,
}: HrPublicProfilePageProps) {
  if (!hrUser) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>
        <div className="rounded-xl border border-border bg-card py-10 text-center text-muted-foreground">
          Профиль HR не найден
        </div>
      </div>
    );
  }

  const org = hrUser.organizerProfile;

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Назад к подписчикам
        </button>

        <div>
          <h2 className="text-3xl font-bold text-foreground">{hrUser.name}</h2>
          <p className="text-muted-foreground mt-1">Публичный профиль HR</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2">
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              Контактный email
            </p>
            <p className="font-medium text-foreground break-all">
              {hrUser.email}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-2">
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              Телефон
            </p>
            <p className="font-medium text-foreground">
              {hrUser.phone || "Не указан"}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
            <Building2 className="w-4 h-4 text-primary" />
            Организация
          </p>

          <p className="font-medium text-foreground">
            {org?.organizationName || "Организация не указана"}
          </p>

          {org?.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {org.description}
            </p>
          )}

          {org?.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline break-all">
              <Globe className="w-4 h-4" />
              {org.website}
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
