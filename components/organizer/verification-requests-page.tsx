"use client";

import { Achievement } from "@/lib/types";
import { useState } from "react";

interface VerificationRequestsPageProps {
  requests: Achievement[];
  onApprove: (achievementId: string, comment?: string) => void;
  onReject: (achievementId: string, comment?: string) => void;
}

export function VerificationRequestsPage({
  requests,
  onApprove,
  onReject,
}: VerificationRequestsPageProps) {
  const [comments, setComments] = useState<Record<string, string>>({});

  const getComment = (achievementId: string) => comments[achievementId] ?? "";

  const handleCommentChange = (achievementId: string, value: string) => {
    setComments((prev) => ({ ...prev, [achievementId]: value }));
  };

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-3xl font-bold text-foreground mb-1">
          Запросы на подтверждение
        </h2>
        <p className="text-muted-foreground">
          Подтвердите достижение обучающегося или отклоните запрос
        </p>
      </section>

      {requests.length === 0 ? (
        <div className="bg-card border border-border rounded-lg py-14 text-center text-muted-foreground">
          Нет активных запросов на подтверждение
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Обучающийся
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Достижение
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Уровень
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Дата
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                    Комментарий
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className={`border-b border-border last:border-b-0 ${
                      request.eventNotInList ? "bg-amber-50" : ""
                    }`}>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {request.studentName || request.studentId}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="font-medium">{request.title}</div>
                      {request.eventNotInList && (
                        <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                          Мероприятия не было в списке
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {request.result}
                      </div>
                      {request.requestComment && (
                        <div className="text-xs text-foreground mt-1">
                          Комментарий студента: {request.requestComment}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {request.level}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(request.date).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <input
                        type="text"
                        value={getComment(request.id)}
                        onChange={(e) =>
                          handleCommentChange(request.id, e.target.value)
                        }
                        placeholder="Комментарий (необязательно)"
                        className="w-full min-w-[220px] px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onApprove(request.id, getComment(request.id))
                          }
                          className="px-3 py-1.5 rounded-lg bg-[var(--verified)] text-white text-xs hover:opacity-90">
                          Подтвердить
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onReject(request.id, getComment(request.id))
                          }
                          className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90">
                          Отказать
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
