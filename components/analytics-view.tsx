// ============================================================================
//  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
//  All rights reserved.
//
//  This software and its source code are the proprietary property of Djonros.
//  Unauthorized copying, modification, merging, publication, distribution,
//  sublicensing, and/or selling of this software, via any medium, is strictly
//  prohibited without prior written permission from the copyright holder.
//
//  Licensed under the Proprietary License.
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License by contacting: djonros@gmail.com
//
//  Violators will be prosecuted to the maximum extent possible under the law.
// ============================================================================

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface StageDistributionItem {
  stage: string;
  count: number;
}

interface ProjectBudgetItem {
  name: string;
  budget: number;
  spent: number;
}

interface EngineerStat {
  name: string;
  completed: number;
  active: number;
  reworks: number;
}

interface MonthlyTrendItem {
  label: string;
  created: number;
  completed: number;
}

interface AnalyticsViewProps {
  stageDistribution: StageDistributionItem[];
  projectBudgets: ProjectBudgetItem[];
  engineerStats: EngineerStat[];
  monthlyTrend: MonthlyTrendItem[];
  summary: {
    totalTasks: number;
    totalCost: number;
    totalReworks: number;
    totalBudget: number;
  };
}

interface TooltipPayloadItem {
  value: number;
  name: string;
  color: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-1 text-sm font-medium">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

const SUMMARY_CARDS = [
  {
    key: "totalTasks" as const,
    label: "Всего задач",
    icon: CheckCircle2,
    format: (v: number) => String(v),
  },
  {
    key: "totalBudget" as const,
    label: "Бюджет проектов",
    icon: Wallet,
    format: (v: number) => formatCurrency(v),
  },
  {
    key: "totalCost" as const,
    label: "Выполнено на сумму",
    icon: TrendingUp,
    format: (v: number) => formatCurrency(v),
  },
  {
    key: "totalReworks" as const,
    label: "Доработок",
    icon: AlertTriangle,
    format: (v: number) => String(v),
  },
];

export function AnalyticsView({
  stageDistribution,
  projectBudgets,
  engineerStats,
  monthlyTrend,
  summary,
}: AnalyticsViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground">
          Метрики отдела и загрузка сотрудников
        </p>
      </div>

      {/* Summary KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_CARDS.map((card) => {
          const value = summary[card.key];
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.format(value)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Stage distribution + Monthly trend */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Загрузка по стадиям</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stageDistribution}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="count"
                  name="Задач"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Тренд за 6 месяцев
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-2))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-2))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Создано"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#gradCreated)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Завершено"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#gradDone)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project budgets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Бюджет проектов</CardTitle>
        </CardHeader>
        <CardContent>
          {projectBudgets.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Нет данных о проектах
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={projectBudgets}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}к` : String(v)
                  }
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={120}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={
                    <ChartTooltip formatter={(v) => formatCurrency(v)} />
                  }
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="budget"
                  name="Бюджет"
                  fill="hsl(var(--chart-3))"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="spent"
                  name="Выполнено"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Engineer efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Эффективность сотрудников
          </CardTitle>
        </CardHeader>
        <CardContent>
          {engineerStats.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Нет данных по сотрудникам
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engineerStats}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="completed"
                  name="Завершено"
                  stackId="a"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="active"
                  name="В работе"
                  stackId="a"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="reworks"
                  name="Доработки"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
