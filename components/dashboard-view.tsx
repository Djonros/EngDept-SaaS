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

import Link from "next/link";
import {
  FolderKanban,
  ListTodo,
  AlertCircle,
  Users,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/task-card";
import { cn, formatCurrency } from "@/lib/utils";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  type TaskStage,
  type TaskWithRelations,
} from "@/lib/types";

interface DashboardStats {
  activeProjects: number;
  totalTasks: number;
  overdueTasks: number;
  teamSize: number;
  totalBudget: number;
}

interface DashboardViewProps {
  workspaceName: string;
  stats: DashboardStats;
  stageCounts: Record<TaskStage, number>;
  recentTasks: TaskWithRelations[];
}

const STAT_CARDS = [
  { key: "activeProjects", label: "Активные проекты", icon: FolderKanban },
  { key: "totalTasks", label: "Всего задач", icon: ListTodo },
  { key: "overdueTasks", label: "Просрочено", icon: AlertCircle },
  { key: "teamSize", label: "Команда", icon: Users },
] as const;

export function DashboardView({
  workspaceName,
  stats,
  stageCounts,
  recentTasks,
}: DashboardViewProps) {
  const totalTasks = stats.totalTasks || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground">
          {workspaceName} — обзор отдела
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const value = stats[card.key];
          const danger = card.key === "overdueTasks" && value > 0;
          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <card.icon
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    danger && "text-destructive"
                  )}
                />
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    danger && "text-destructive"
                  )}
                >
                  {value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Budget + pipeline */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Конвейер по стадиям СТП
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {STAGE_ORDER.map((stage) => {
              const count = stageCounts[stage] ?? 0;
              const pct = Math.round((count / totalTasks) * 100);
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-muted-foreground">
                    {STAGE_LABELS[stage]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: `var(--kanban-${stage})`,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-medium tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Budget + quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Бюджет проектов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Суммарный бюджет активных проектов
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href="/projects">
                  <FolderKanban className="mr-2 h-4 w-4" />
                  Все проекты
                </Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/tasks">
                  <ListTodo className="mr-2 h-4 w-4" />
                  Доска задач
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Последние задачи</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/tasks">
              Все задачи
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Задач пока нет. Создайте первую задачу на странице проектов.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
