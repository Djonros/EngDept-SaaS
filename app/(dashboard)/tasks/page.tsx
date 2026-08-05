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
import { TasksBoard } from "@/components/tasks-board";
import type { TaskWithRelations } from "@/lib/types";

export default async function TasksPage() {
  const session = await requireSession();
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const [{ data: tasks }, { data: projects }, { data: milestones }, { data: users }] =
    await Promise.all([
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
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("id, title")
        .eq("workspace_id", wid)
        .order("title"),
      supabase
        .from("milestones")
        .select("id, title, project_id")
        .order("order_index"),
      supabase
        .from("users")
        .select("id, name")
        .eq("workspace_id", wid)
        .eq("is_active", true)
        .order("name"),
    ]);

  return (
    <TasksBoard
      tasks={(tasks ?? []) as unknown as TaskWithRelations[]}
      workspaceId={wid}
      options={{
        projects: projects ?? [],
        milestones: milestones ?? [],
        users: users ?? [],
      }}
    />
  );
}
