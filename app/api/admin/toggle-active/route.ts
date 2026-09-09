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
//  POST /api/admin/toggle-active — enable/disable user in workspace
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { getUserById, setUserActive, writeAudit } from "@/lib/repo";

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!isManagerOrOwner(session)) return forbidden();

  const { userId, isActive } = (await request.json()) as {
    userId?: string;
    isActive?: boolean;
  };

  if (!userId || isActive === undefined) {
    return Response.json({ error: "userId и isActive обязательны" }, { status: 400 });
  }

  const user = getUserById(userId);
  if (!user || user.workspace_id !== session.workspace.id) {
    return Response.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  setUserActive(userId, isActive);
  writeAudit(session.workspace.id, session.user.id, "user.toggled", "user", userId, {
    is_active: isActive,
  });

  return Response.json({ success: true });
}
