"use client";

import { Achievement, AchievementLevel } from "@/lib/types";
import { CHART_DATA } from "@/lib/data";
import { calculateStudentMetrics } from "@/lib/metrics";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, InfoIcon } from "lucide-react";
import { useState } from "react";

interface DashboardsPageProps {
  achievements: Achievement[];
}

const LEVEL_COLORS: Record<AchievementLevel, string> = {
  Международный: "#4f46e5",
  Всероссийский: "#7c3aed",
  Региональный: "#06b6d4",
  Вузовский: "#8b5cf6",
  Факультетский: "#ec4899",
};

export function DashboardsPage({ achievements }: DashboardsPageProps) {
  const {
    activityIndex,
    highestLevel,
    percentile,
    verifiedCount,
    levelDistribution,
  } = calculateStudentMetrics(achievements);

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex-1 flex flex-col gap-8">
      <section>
        <h2 className="text-3xl font-bold text-foreground mb-2">Дашборды</h2>
        <p className="text-muted-foreground">
          Метрики рассчитываются только на основе подтвержденных достижений
        </p>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">
            Индекс активности
          </div>
          <div className="text-3xl font-bold text-foreground">
            {activityIndex}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            взвешенная сумма баллов
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">
            Уровень достижений
          </div>
          <div className="text-2xl md:text-3xl font-bold text-primary leading-tight break-words [overflow-wrap:anywhere]">
            {highestLevel}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            самый высокий уровень
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">Процентиль</div>
          <div className="text-3xl font-bold text-foreground">
            {percentile}%
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${percentile}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-2">
            Количество подтвержденных
          </div>
          <div className="text-3xl font-bold text-verified">
            {verifiedCount}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            всего достижений
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Dynamics by year */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Динамика по годам
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  cursor={{ fill: "#f3f4f6" }}
                />
                <Bar
                  dataKey="participations"
                  fill="#4f46e5"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart - Distribution by level */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Распределение по уровням
          </h3>
          {levelDistribution.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={levelDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">
                    {levelDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LEVEL_COLORS[entry.name as AchievementLevel]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              Нет данных для отображения
            </div>
          )}
        </div>
      </div>

      {/* Scoring Info */}
      <div className="bg-accent/10 border border-accent rounded-lg p-6">
        <div className="flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-accent-foreground mt-1 flex-shrink-0" />
          <div className="w-full">
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className="w-full flex items-center justify-between gap-3 text-accent-foreground font-semibold hover:underline text-left">
              <span>Как рассчитывается индекс активности?</span>
              <ChevronDown
                className={`w-4 h-4 flex-shrink-0 transition-transform ${showTooltip ? "rotate-180" : "rotate-0"}`}
              />
            </button>
            <div
              className={`grid transition-all duration-300 ease-out ${showTooltip ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"}`}>
              <div className="overflow-hidden">
                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="text-sm">
                    <div className="font-semibold text-foreground mb-2">
                      Система начисления баллов:
                    </div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>• Международный = 5 баллов</div>
                      <div>• Всероссийский = 3 балла</div>
                      <div>• Региональный = 1 балл</div>
                      <div>• Вузовский = 0 баллов</div>
                      <div>• Факультетский = 0 баллов</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
