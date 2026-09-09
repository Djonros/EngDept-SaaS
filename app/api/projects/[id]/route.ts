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
//  PATCH /api/projects/[id] — update
//  DELETE /api/projects/[id]
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { deleteProject, getProject, updateProject } from "@/lib/repo";
import type { ProjectStatus } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  try {
    const existing = getProject(session.workspace.id, params.id);
    if (!existing) {
      return Response.json({ error: "Проект не найден" }, { status: 404 });
    }

    const body = (await request.json()) as {
      title?: string;
      description?: string | null;
      budget?: number;
      target_date?: string | null;
      status?: ProjectStatus;
    };

    updateProject(session.workspace.id, params.id, {
      title: body.title?.trim(),
      description: body.description ?? undefined,
      budget: body.budget != null ? Number(body.budget) : undefined,
      target_date: body.target_date ?? undefined,
      status: body.status,
    }, session.user.id);

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
  if (!isManagerOrOwner(session)) return forbidden();

  try {
    const existing = getProject(session.workspace.id, params.id);
    if (!existing) {
      return Response.json({ error: "Проект не найден" }, { status: 404 });
    }

    deleteProject(session.workspace.id, params.id, session.user.id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
