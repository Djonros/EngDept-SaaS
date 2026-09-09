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
//  POST /api/admin/reset-password — owner sets a new password for a user
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { getUserById, resetUserPassword, writeAudit } from "@/lib/repo";

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!session.roles.includes("owner")) return forbidden();

  try {
    const { userId, password } = (await request.json()) as {
      userId?: string;
      password?: string;
    };

    if (!userId || !password || password.length < 6) {
      return Response.json(
        { error: "userId и пароль (мин. 6 символов) обязательны" },
        { status: 400 }
      );
    }

    const user = getUserById(userId);
    if (!user || user.workspace_id !== session.workspace.id) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    resetUserPassword(userId, hashPassword(password));
    writeAudit(session.workspace.id, session.user.id, "user.password_reset", "user", userId);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
