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
//  POST /api/admin/update-role
//  Changes a user's role within the workspace (including owner role changes).
//  Uses service role key to bypass RLS (allows owner role mutations).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-client";
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
    const { userId, role } = (await request.json()) as {
      userId?: string;
      role?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { error: "userId обязателен" },
        { status: 400 }
      );
    }

    if (!role || !VALID_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        { error: "Некорректная роль" },
        { status: 400 }
      );
    }

    // Verify caller session
    const serverClient = createServerClient();
    const {
      data: { user: authUser },
    } = await serverClient.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { data: caller } = await serverClient
      .from("users")
      .select("id, workspace_id, role")
      .eq("id", authUser.id)
      .single();

    if (!caller || (caller.role !== "owner" && caller.role !== "manager")) {
      return NextResponse.json(
        { error: "Недостаточно прав" },
        { status: 403 }
      );
    }

    // Use admin client — allows changing any user including owner
    const admin = createAdminClient();

    // If demoting an owner, check they're not the last owner
    const { data: targetUser } = await admin
      .from("users")
      .select("id, workspace_id, role")
      .eq("id", userId)
      .single();

    if (!targetUser || targetUser.workspace_id !== caller.workspace_id) {
      return NextResponse.json(
        { error: "Пользователь не найден в вашем workspace" },
        { status: 404 }
      );
    }

    if (targetUser.role === "owner" && role !== "owner") {
      const { count } = await admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", caller.workspace_id)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "Нельзя снять роль владельца — это последний владелец в workspace" },
          { status: 400 }
        );
      }
    }

    const { error: updateErr } = await admin
      .from("users")
      .update({ role: role as UserRole })
      .eq("id", userId);

    if (updateErr) {
      return NextResponse.json(
        { error: "Ошибка: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
