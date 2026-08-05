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
import { createServerClient } from "@/lib/supabase-server";
import { MyTasksView } from "@/components/my-tasks-view";
import type { TaskFormOptions } from "@/components/task-form-dialog";
import type { TaskWithRelations } from "@/lib/types";

export default async function MyTasksPage() {
  const session = await requireSession();
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        `*,
        assignee:users!assignee_id(id, name, avatar_url),
        reviewer:users!reviewer_id(id, name, avatar_url),
        project:projects(id, title),
        milestone:milestones(id, title)`
      )
      .eq("workspace_id", wid)
      .eq("assignee_id", session.user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, title")
      .eq("workspace_id", wid)
      .eq("status", "active"),
  ]);

  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: milestones } = await supabase
    .from("milestones")
    .select("id, title, project_id")
    .in("project_id", projectIds);

  const options: TaskFormOptions = {
    projects: projects ?? [],
    milestones: milestones ?? [],
    users: [{ id: session.user.id, name: session.user.name }],
  };

  return (
    <MyTasksView
      tasks={(tasks ?? []) as unknown as TaskWithRelations[]}
      workspaceId={wid}
      options={options}
    />
  );
}
