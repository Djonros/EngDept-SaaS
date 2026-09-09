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

// ============================================================================
//  POST /api/tasks — create task
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden } from "@/lib/api-auth";
import { createTask, type TaskInput } from "@/lib/repo";

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();

  const staffRoles = ["owner", "manager", "engineer", "reviewer"];
  const isStaff = session.roles.some((r) => staffRoles.includes(r));
  if (!isStaff) return forbidden();

  try {
    const body = (await request.json()) as Partial<TaskInput>;

    if (!body.title?.trim() || !body.project_id) {
      return Response.json({ error: "Название и проект обязательны" }, { status: 400 });
    }

    const task = createTask(session.workspace.id, session.user.id, {
      project_id: body.project_id,
      milestone_id: body.milestone_id ?? null,
      assignee_id: body.assignee_id ?? null,
      reviewer_id: body.reviewer_id ?? null,
      stage: body.stage ?? "brief",
      title: body.title.trim(),
      description: body.description ?? null,
      yandex_disk_link: body.yandex_disk_link ?? null,
      cost: body.cost ?? 0,
      due_date: body.due_date ?? null,
    });

    if (!task) {
      return Response.json({ error: "Проект не найден" }, { status: 404 });
    }

    return Response.json({ success: true, task });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
