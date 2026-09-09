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
//  PATCH /api/project-members/[id] — change role
//  DELETE /api/project-members/[id]
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { removeProjectMemberById, updateProjectMemberRoleById } from "@/lib/repo";
import type { ProjectMember } from "@/lib/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  const body = (await request.json()) as { role?: ProjectMember["role"] };
  if (!body.role) {
    return Response.json({ error: "role обязательна" }, { status: 400 });
  }

  const ok = updateProjectMemberRoleById(session.workspace.id, params.id, body.role);
  if (!ok) return Response.json({ error: "Участник не найден" }, { status: 404 });

  return Response.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  const ok = removeProjectMemberById(session.workspace.id, params.id);
  if (!ok) return Response.json({ error: "Участник не найден" }, { status: 404 });

  return Response.json({ success: true });
}
