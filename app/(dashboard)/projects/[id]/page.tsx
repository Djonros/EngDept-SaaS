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

import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  listMilestonesForProject,
  listProjectMembers,
  listTasks,
  getProject,
  listWorkspaceUsers,
} from "@/lib/repo";
import { ProjectDetailView } from "@/components/project-detail-view";
import type { Project, ProjectMemberWithUser, TaskWithRelations } from "@/lib/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const wid = session.workspace.id;

  const project = getProject(wid, params.id);
  if (!project) notFound();

  const tasks = listTasks(wid, { projectId: params.id });
  const milestones = listMilestonesForProject(wid, params.id).map((m) => ({
    id: m.id,
    title: m.title,
    project_id: m.project_id,
  }));
  const users = listWorkspaceUsers(wid)
    .filter((u) => u.is_active)
    .map((u) => ({ id: u.id, name: u.name }));
  const members = listProjectMembers(wid, params.id);

  return (
    <ProjectDetailView
      project={project as Project}
      tasks={tasks as unknown as TaskWithRelations[]}
      milestones={milestones}
      members={members as unknown as ProjectMemberWithUser[]}
      workspaceId={wid}
      options={{
        projects: [{ id: project.id, title: project.title }],
        milestones,
        users,
      }}
    />
  );
}
