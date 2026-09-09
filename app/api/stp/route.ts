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
//  PUT /api/stp — upsert stage checklist
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized } from "@/lib/api-auth";
import { upsertStpChecklist } from "@/lib/repo";
import type { StpChecklistItem, TaskStage } from "@/lib/types";

const STAFF_ROLES = ["owner", "manager", "reviewer"];

export async function PUT(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();

  const isStaff = session.roles.some((r) => STAFF_ROLES.includes(r));
  if (!isStaff) return Response.json({ error: "Недостаточно прав" }, { status: 403 });

  try {
    const body = (await request.json()) as {
      stage?: TaskStage;
      items?: StpChecklistItem[];
    };

    if (!body.stage || !Array.isArray(body.items)) {
      return Response.json({ error: "stage и items обязательны" }, { status: 400 });
    }

    upsertStpChecklist(session.workspace.id, body.stage, body.items);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
