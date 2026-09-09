// ============================================================================
//  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
//  All rights reserved.
//
//  This software and its source code is the proprietary property of Djonros.
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
//  PATCH /api/tasks/[id] — update (stage move, edit)
//  DELETE /api/tasks/[id]
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized } from "@/lib/api-auth";
import { deleteTask, getTask, updateTask, type TaskInput } from "@/lib/repo";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = apiSession(request);
  if (!session) return unauthorized();

  try {
    const existing = getTask(session.workspace.id, params.id);
    if (!existing) {
      return Response.json({ error: "Задача не найдена" }, { status: 404 });
    }

    // Freelancers may only move their own tasks
    const isFreelancerOnly =
      session.roles.includes("freelancer") && session.roles.length === 1;
    if (isFreelancerOnly && existing.assignee_id !== session.user.id) {
      return Response.json({ error: "Недостаточно прав" }, { status: 403 });
    }

    const body = (await request.json()) as Partial<TaskInput> & {
      completed_at?: string | null;
      paid_at?: string | null;
      rework_count?: number;
    };

    updateTask(session.workspace.id, session.user.id, params.id, body);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = apiSession(request);
  if (!session) return unauthorized();

  try {
    const existing = getTask(session.workspace.id, params.id);
    if (!existing) {
      return Response.json({ error: "Задача не найдена" }, { status: 404 });
    }

    deleteTask(session.workspace.id, session.user.id, params.id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
