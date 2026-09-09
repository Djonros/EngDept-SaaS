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
//  POST /api/admin/add-user
//  Moves an already-registered user into the caller's workspace with roles.
//  User limit enforced by DB trigger (freemium).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { apiSession, unauthorized, forbidden, isManagerOrOwner } from "@/lib/api-auth";
import {
  countWorkspaceUsers,
  getUserByEmail,
  getWorkspaceById,
  moveUserToWorkspace,
  writeAudit,
} from "@/lib/repo";
import { getPlanConfig } from "@/lib/plans";
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
    const { email, roles, role } = (await request.json()) as {
      email?: string;
      roles?: string[];
      role?: string;
    };

    const newRoles = (roles ?? (role ? [role] : [])) as UserRole[];

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
    }

    if (newRoles.length === 0) {
      return NextResponse.json({ error: "Нужна хотя бы одна роль" }, { status: 400 });
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

    const workspace = getWorkspaceById(session.workspace.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace не найден" }, { status: 404 });
    }

    const maxUsers = Math.min(
      workspace.max_users,
      getPlanConfig(workspace.plan).maxUsers
    );
    if (countWorkspaceUsers(workspace.id) >= maxUsers) {
      return NextResponse.json(
        {
          error: `Достигнут лимит пользователей тарифа (${maxUsers}). Улучшите тариф в разделе «Тарифы».`,
        },
        { status: 402 }
      );
    }

    const existingUser = getUserByEmail(email.trim());
    if (!existingUser) {
      return NextResponse.json(
        {
          error:
            "Пользователь не найден. Попросите сотрудника сначала зарегистрироваться на платформе.",
        },
        { status: 404 }
      );
    }

    if (existingUser.workspace_id === workspace.id) {
      return NextResponse.json(
        { error: "Пользователь уже в вашем workspace" },
        { status: 409 }
      );
    }

    try {
      moveUserToWorkspace(existingUser.id, workspace.id, newRoles);
    } catch (err) {
      if (err instanceof Error && err.message.includes("лимит")) {
        return NextResponse.json(
          { error: "Достигнут лимит пользователей тарифа — обновите тариф" },
          { status: 402 }
        );
      }
      throw err;
    }

    writeAudit(
      workspace.id,
      session.user.id,
      "user.added",
      "user",
      existingUser.id,
      { email: existingUser.email, roles: newRoles }
    );

    return NextResponse.json({ success: true, name: existingUser.name }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
