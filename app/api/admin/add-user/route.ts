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
//  POST /api/admin/add-user
//  Adds an already-registered user to the caller's workspace with a role.
//  Searches public.users by email (bypasses RLS via service role key).
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
    const { email, role } = (await request.json()) as {
      email?: string;
      role?: string;
    };

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email обязателен" },
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

    // Use admin client to search across all workspaces
    const admin = createAdminClient();
    const { data: existingUser } = await admin
      .from("users")
      .select("id, workspace_id, name, email")
      .eq("email", email.trim().toLowerCase())
      .single();

    if (!existingUser) {
      return NextResponse.json(
        {
          error:
            "Пользователь не найден. Попросите сотрудника сначала зарегистрироваться на платформе.",
        },
        { status: 404 }
      );
    }

    if (existingUser.workspace_id === caller.workspace_id) {
      return NextResponse.json(
        { error: "Пользователь уже в вашем workspace" },
        { status: 409 }
      );
    }

    // Move user to caller's workspace with new role
    const { error: updateErr } = await admin
      .from("users")
      .update({
        workspace_id: caller.workspace_id,
        role: role as UserRole,
        is_active: true,
      })
      .eq("id", existingUser.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Ошибка: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, name: existingUser.name },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
