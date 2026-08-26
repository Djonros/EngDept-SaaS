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

import { requireStaffSession } from "@/lib/session";
import { createServerClient } from "@/lib/supabase-server";
import { AnalyticsView } from "@/components/analytics-view";
import { PlanPaywall } from "@/components/plan-paywall";
import { hasFeature } from "@/lib/plans";
import { STAGE_ORDER, STAGE_LABELS } from "@/lib/types";

export default async function AnalyticsPage() {
  const session = await requireStaffSession();
  if (!hasFeature(session.workspace.plan, "analytics")) {
    return <PlanPaywall feature="analytics" />;
  }
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const [{ data: tasks }, { data: projects }, { data: engineers }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          `id, project_id, stage, cost, rework_count, assignee_id, completed_at, created_at`
        )
        .eq("workspace_id", wid),
      supabase
        .from("projects")
        .select("id, title, budget, status, target_date, created_at")
        .eq("workspace_id", wid)
        .order("created_at", { ascending: false }),
      supabase
        .from("users")
        .select("id, name, role")
        .eq("workspace_id", wid)
        .eq("is_active", true)
        .in("role", ["engineer", "freelancer", "reviewer"]),
    ]);

  const taskList = tasks ?? [];
  const projectList = projects ?? [];
  const engineerList = engineers ?? [];

  // --- 1. Stage distribution ---
  const stageDistribution = STAGE_ORDER.map((stage) => ({
    stage: STAGE_LABELS[stage],
    count: taskList.filter((t) => t.stage === stage).length,
  }));

  // --- 2. Project budgets (top 8 by budget) ---
  const projectBudgets = [...projectList]
    .sort((a, b) => (Number(b.budget) || 0) - (Number(a.budget) || 0))
    .slice(0, 8)
    .map((p) => ({
      name: p.title.length > 20 ? p.title.slice(0, 20) + "…" : p.title,
      budget: Number(p.budget) || 0,
      spent: taskList
        .filter((t) => t.project_id === p.id && t.stage === "done")
        .reduce((sum, t) => sum + (Number(t.cost) || 0), 0),
    }));

  // --- 3. Engineer efficiency ---
  const engineerStats = engineerList
    .map((eng) => {
      const engTasks = taskList.filter((t) => t.assignee_id === eng.id);
      return {
        name: eng.name.split(" ")[0],
        completed: engTasks.filter((t) => t.stage === "done").length,
        active: engTasks.filter(
          (t) => t.stage !== "done"
        ).length,
        reworks: engTasks.reduce((sum, t) => sum + (t.rework_count || 0), 0),
      };
    })
    .filter((e) => e.completed > 0 || e.active > 0);

  // --- 4. Monthly task trend (last 6 months) ---
  const now = new Date();
  const months: { label: string; created: number; completed: number }[] = [];
  const monthNames = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      label: monthNames[d.getMonth()],
      created: taskList.filter((t) => {
        const c = new Date(t.created_at);
        return c >= d && c < nextD;
      }).length,
      completed: taskList.filter((t) => {
        if (!t.completed_at) return false;
        const c = new Date(t.completed_at);
        return c >= d && c < nextD;
      }).length,
    });
  }

  // --- 5. Summary KPIs ---
  const totalCost = taskList
    .filter((t) => t.stage === "done")
    .reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
  const totalReworks = taskList.reduce(
    (sum, t) => sum + (t.rework_count || 0),
    0
  );
  const totalBudget = projectList.reduce(
    (sum, p) => sum + (Number(p.budget) || 0),
    0
  );

  return (
    <AnalyticsView
      stageDistribution={stageDistribution}
      projectBudgets={projectBudgets}
      engineerStats={engineerStats}
      monthlyTrend={months}
      summary={{
        totalTasks: taskList.length,
        totalCost,
        totalReworks,
        totalBudget,
      }}
    />
  );
}
