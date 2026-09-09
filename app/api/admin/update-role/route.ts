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
//  POST /api/admin/update-role
//  Sets a user's roles (array) within the workspace — supports multiple roles.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import { getDb } from "@/lib/db";
import { getUserById, updateUserRoles, writeAudit } from "@/lib/repo";
import type { UserRole } from "@/lib/types";

const VALID_ROLES: UserRole[] = [
  "owner",
  "manager",
  "engineer",
  "reviewer",
  "freelancer",
];

export async function POST(request: NextRequest) {
  try {
    const { userId, roles, role } = (await request.json()) as {
      userId?: string;
      roles?: string[];
      role?: string;
    };

    const newRoles = (roles ?? (role ? [role] : [])) as UserRole[];

    if (!userId) {
      return NextResponse.json({ error: "userId обязателен" }, { status: 400 });
    }

    if (newRoles.length === 0) {
      return NextResponse.json(
        { error: "Нужна хотя бы одна роль" },
        { status: 400 }
      );
    }

    const invalid = newRoles.find((r) => !VALID_ROLES.includes(r));
    if (invalid) {
      return NextResponse.json(
        { error: "Некорректная роль: " + invalid },
        { status: 400 }
      );
    }

    const session = apiSession(request);
    if (!session) return unauthorized();
    if (!isManagerOrOwner(session)) return forbidden();

    const targetUser = getUserById(userId);
    if (!targetUser || targetUser.workspace_id !== session.workspace.id) {
      return NextResponse.json(
        { error: "Пользователь не найден в вашем workspace" },
        { status: 404 }
      );
    }

    if (targetUser.roles.includes("owner") && !newRoles.includes("owner")) {
      const owners = getDb()
        .prepare(
          `SELECT COUNT(*) AS c FROM users WHERE workspace_id = ? AND roles LIKE '%"owner"%'`
        )
        .get(session.workspace.id) as { c: number };

      if (owners.c <= 1) {
        return NextResponse.json(
          { error: "Нельзя снять роль владельца — это последний владелец в workspace" },
          { status: 400 }
        );
      }
    }

    updateUserRoles(userId, newRoles);
    writeAudit(session.workspace.id, session.user.id, "user.roles_updated", "user", userId, {
      roles: newRoles,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
