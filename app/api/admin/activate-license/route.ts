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
//  POST /api/admin/activate-license
//  Server-side license activation. Client-side lookup is impossible under
//  RLS (unbound license rows have workspace_id = NULL, invisible to users).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { licenseKey } = (await request.json()) as { licenseKey?: string };

    if (!licenseKey || !licenseKey.trim()) {
      return NextResponse.json(
        { error: "Введите лицензионный ключ" },
        { status: 400 }
      );
    }

    const serverClient = createServerClient();
    const {
      data: { user: authUser },
    } = await serverClient.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const { data: caller } = await serverClient
      .from("users")
      .select("id, workspace_id, role, roles")
      .eq("id", authUser.id)
      .single();

    const callerRoles =
      (caller?.roles as string[] | null) ?? (caller ? [caller.role] : []);

    if (!caller || !callerRoles.includes("owner")) {
      return NextResponse.json(
        { error: "Доступ только для владельца workspace" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();
    const { data: license } = await admin
      .from("licenses")
      .select("*")
      .eq("key", licenseKey.trim().toUpperCase())
      .single();

    if (!license) {
      return NextResponse.json(
        { error: "Лицензионный ключ не найден" },
        { status: 404 }
      );
    }

    if (license.status === "revoked") {
      return NextResponse.json({ error: "Лицензия отозвана" }, { status: 400 });
    }

    if (license.workspace_id && license.workspace_id !== caller.workspace_id) {
      return NextResponse.json(
        { error: "Ключ уже привязан к другому workspace" },
        { status: 409 }
      );
    }

    const { error: wsErr } = await admin
      .from("workspaces")
      .update({
        plan: license.plan,
        license_key: license.key,
        expires_at: license.expires_at,
      })
      .eq("id", caller.workspace_id);

    if (wsErr) {
      return NextResponse.json(
        { error: "Ошибка активации: " + wsErr.message },
        { status: 500 }
      );
    }

    await admin
      .from("licenses")
      .update({
        workspace_id: caller.workspace_id,
        status: "active",
        activated_at: new Date().toISOString(),
      })
      .eq("id", license.id);

    return NextResponse.json({ success: true, plan: license.plan }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
