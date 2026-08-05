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

import { requireSession } from "@/lib/session";
import { createServerClient } from "@/lib/supabase-server";
import { AdminPanel } from "@/components/admin-panel";
import type { User, AuditLogEntry } from "@/lib/types";

export default async function AdminPage() {
  const session = await requireSession();

  if (session.role !== "owner") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Доступ только для владельца workspace
        </p>
      </div>
    );
  }

  const supabase = createServerClient();
  const wid = session.workspace.id;

  const [{ data: users }, { data: auditLog }] = await Promise.all([
    supabase
      .from("users")
      .select("*")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: true }),
    supabase
      .from("audit_log")
      .select("*")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <AdminPanel
      workspace={session.workspace}
      users={(users ?? []) as unknown as User[]}
      auditLog={(auditLog ?? []) as unknown as AuditLogEntry[]}
      currentUserId={session.user.id}
    />
  );
}
