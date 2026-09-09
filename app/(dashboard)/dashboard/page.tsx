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

import { requireSession } from "@/lib/session";
import { countActiveWorkspaceUsers, listActiveProjectsBrief, listTasks } from "@/lib/repo";
import { DashboardView } from "@/components/dashboard-view";
import {
  STAGE_ORDER,
  type TaskStage,
  type TaskWithRelations,
} from "@/lib/types";

export default async function DashboardPage() {
  const session = await requireSession();
  const wid = session.workspace.id;

  const [taskList, projects, teamSize] = [
    listTasks(wid, { limit: 50 }),
    listActiveProjectsBrief(wid),
    countActiveWorkspaceUsers(wid),
  ];

  const tasks = taskList as TaskWithRelations[];
  const now = new Date();

  const stageCounts = STAGE_ORDER.reduce(
    (acc, stage) => {
      acc[stage] = tasks.filter((t) => t.stage === stage).length;
      return acc;
    },
    {} as Record<TaskStage, number>
  );

  const overdueTasks = tasks.filter(
    (t) => t.due_date && !t.completed_at && new Date(t.due_date) < now
  ).length;

  const totalBudget = projects.reduce(
    (sum, p) => sum + (p.budget ? Number(p.budget) : 0),
    0
  );

  return (
    <DashboardView
      workspaceName={session.workspace.name}
      stats={{
        activeProjects: projects.length,
        totalTasks: tasks.length,
        overdueTasks,
        teamSize: teamSize ?? 0,
        totalBudget,
      }}
      stageCounts={stageCounts}
      recentTasks={tasks.slice(0, 8)}
    />
  );
}
