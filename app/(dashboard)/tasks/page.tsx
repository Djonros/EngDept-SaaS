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
import { listMilestonesForWorkspace, listProjects, listTasks, listWorkspaceUsers } from "@/lib/repo";
import { TasksBoard } from "@/components/tasks-board";
import type { TaskWithRelations } from "@/lib/types";

export default async function TasksPage() {
  const session = await requireSession();
  const wid = session.workspace.id;

  const tasks = listTasks(wid);
  const projects = listProjects(wid).map((p) => ({ id: p.id, title: p.title }));
  const milestones = listMilestonesForWorkspace(wid).map((m) => ({
    id: m.id,
    title: m.title,
    project_id: m.project_id,
  }));
  const users = listWorkspaceUsers(wid)
    .filter((u) => u.is_active)
    .map((u) => ({ id: u.id, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <TasksBoard
      tasks={tasks as unknown as TaskWithRelations[]}
      workspaceId={wid}
      options={{
        projects,
        milestones,
        users,
      }}
    />
  );
}
