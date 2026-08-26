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
//  Offline activation: the key carries an Ed25519 signature and is verified
//  locally (no vendor server needed). Writes the license into this
//  deployment's own database.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { activateLicense } from "@/lib/license-server";

export async function POST(request: NextRequest) {
  try {
    const { licenseKey, hardwareId } = (await request.json()) as {
      licenseKey?: string;
      hardwareId?: string;
    };

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

    const result = await activateLicense(
      licenseKey.trim(),
      caller.workspace_id,
      hardwareId ?? ""
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Ошибка активации" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, plan: result.license?.plan },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
