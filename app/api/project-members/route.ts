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
//  POST /api/project-members — add member to project (upsert role)
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { addProjectMember } from "@/lib/repo";
import type { ProjectMember } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  try {
    const body = (await request.json()) as {
      projectId?: string;
      userId?: string;
      role?: ProjectMember["role"];
    };

    if (!body.projectId || !body.userId) {
      return Response.json(
        { error: "projectId и userId обязательны" },
        { status: 400 }
      );
    }

    const ok = addProjectMember(
      session.workspace.id,
      body.projectId,
      body.userId,
      body.role ?? "engineer"
    );

    if (!ok) {
      return Response.json(
        { error: "Проект или пользователь не найдены в workspace" },
        { status: 404 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
