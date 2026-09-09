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
//  POST /api/milestones — create milestone
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { createMilestone } from "@/lib/repo";

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  try {
    const body = (await request.json()) as {
      projectId?: string;
      title?: string;
      orderIndex?: number;
    };

    if (!body.projectId || !body.title?.trim()) {
      return Response.json({ error: "Проект и название обязательны" }, { status: 400 });
    }

    const milestone = createMilestone(
      session.workspace.id,
      body.projectId,
      body.title.trim(),
      body.orderIndex ?? 0
    );

    if (!milestone) {
      return Response.json({ error: "Проект не найден" }, { status: 404 });
    }

    return Response.json({ success: true, milestone });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
