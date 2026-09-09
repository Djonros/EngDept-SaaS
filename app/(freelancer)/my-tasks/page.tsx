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
import { listMilestonesForWorkspace, listProjects, listTasks } from "@/lib/repo";
import { MyTasksView } from "@/components/my-tasks-view";
import type { TaskFormOptions } from "@/components/task-form-dialog";
import type { TaskWithRelations } from "@/lib/types";

export default async function MyTasksPage() {
  const session = await requireSession();
  const wid = session.workspace.id;

  const tasks = listTasks(wid, { assigneeId: session.user.id });
  const projects = listProjects(wid)
    .filter((p) => p.status === "active")
    .map((p) => ({ id: p.id, title: p.title }));
  const activeIds = new Set(projects.map((p) => p.id));
  const milestones = listMilestonesForWorkspace(wid)
    .filter((m) => activeIds.has(m.project_id))
    .map((m) => ({ id: m.id, title: m.title, project_id: m.project_id }));

  const options: TaskFormOptions = {
    projects,
    milestones,
    users: [{ id: session.user.id, name: session.user.name }],
  };

  return (
    <MyTasksView
      tasks={tasks as unknown as TaskWithRelations[]}
      workspaceId={wid}
      options={options}
    />
  );
}
