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
//  POST /api/webhook
//  Generic event webhook: task stage changes, completion, audit events.
//  Can be consumed by external integrations (Telegram, Yandex Disk sync, etc.)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-client";
import { logAction } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { event, workspace_id, user_id, entity_type, entity_id, metadata } = body;

    if (!event || !workspace_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Log to audit_log
    await logAction({
      workspaceId: workspace_id,
      userId: user_id,
      action: event,
      entityType: entity_type,
      entityId: entity_id,
      metadata,
    });

    // Example: trigger Telegram notification on task completion
    if (event === "task.completed" && entity_id) {
      const supabase = createAdminClient();
      const { data: task } = await supabase
        .from("tasks")
        .select("assignee_id, title")
        .eq("id", entity_id)
        .single();

      if (task?.assignee_id) {
        const { data: assignee } = await supabase
          .from("users")
          .select("telegram_id, name")
          .eq("id", task.assignee_id)
          .single();

        if (assignee?.telegram_id) {
          // Delegate to Telegram bot notify endpoint
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", "")}/api/telegram-bot`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "notify",
              telegram_id: assignee.telegram_id,
              message: `✅ Задача «${task.title}» принята.`,
            }),
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
