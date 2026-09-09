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
//  POST /api/multipliers — upsert price multiplier
//  DELETE /api/multipliers?id=...
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { deleteMultiplier, upsertMultiplier } from "@/lib/repo";
import type { PriceMultiplier } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  try {
    const body = (await request.json()) as Partial<PriceMultiplier> & {
      name?: string;
    };

    if (!body.name?.trim()) {
      return Response.json({ error: "Введите название множителя" }, { status: 400 });
    }

    upsertMultiplier(session.workspace.id, {
      id: body.id,
      name: body.name.trim(),
      value: body.value != null ? Number(body.value) : 1,
      applies_to: body.applies_to,
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id обязателен" }, { status: 400 });

  deleteMultiplier(session.workspace.id, id);
  return Response.json({ success: true });
}
