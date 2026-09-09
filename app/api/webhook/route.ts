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
//  POST /api/webhook
//  Generic event webhook: task stage changes, completion, audit events.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getTask, getUserById, writeAudit } from "@/lib/repo";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { event, workspace_id, user_id, entity_type, entity_id, metadata } =
      body as {
        event?: string;
        workspace_id?: string;
        user_id?: string | null;
        entity_type?: string;
        entity_id?: string;
        metadata?: Record<string, unknown>;
      };

    if (!event || !workspace_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    writeAudit(workspace_id, user_id ?? null, event, entity_type, entity_id, metadata ?? {});

    if (event === "task.completed" && entity_id) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const task = getTask(workspace_id, entity_id);
      const assignee = task?.assignee_id ? getUserById(task.assignee_id) : null;

      if (token && assignee?.telegram_id && task) {
        const api = `https://api.telegram.org/bot${token}/sendMessage`;
        fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: assignee.telegram_id,
            text: `✅ Задача «${task.title}» принята.`,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
