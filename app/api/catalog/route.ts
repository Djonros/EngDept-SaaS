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
//  POST /api/catalog — upsert price catalog item
//  DELETE /api/catalog?id=...
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { deleteCatalogItem, upsertCatalogItem } from "@/lib/repo";
import type { PriceCatalogItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  try {
    const body = (await request.json()) as Partial<PriceCatalogItem> & {
      operation_name?: string;
    };

    if (!body.operation_name?.trim()) {
      return Response.json({ error: "Введите название операции" }, { status: 400 });
    }

    upsertCatalogItem(session.workspace.id, {
      id: body.id,
      operation_name: body.operation_name.trim(),
      category: body.category,
      base_price: body.base_price ? Number(body.base_price) : 0,
      unit: body.unit,
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

  deleteCatalogItem(session.workspace.id, id);
  return Response.json({ success: true });
}
