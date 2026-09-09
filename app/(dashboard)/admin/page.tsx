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
import { listAuditLog, listWorkspaceUsers } from "@/lib/repo";
import { AdminPanel } from "@/components/admin-panel";
import type { User, AuditLogEntry } from "@/lib/types";

export default async function AdminPage() {
  const session = await requireSession();

  if (!session.roles.includes("owner")) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Доступ только для владельца workspace
        </p>
      </div>
    );
  }

  const wid = session.workspace.id;

  const users = listWorkspaceUsers(wid);
  const auditLog = listAuditLog(wid, 100);

  return (
    <AdminPanel
      workspace={session.workspace}
      users={users as unknown as User[]}
      auditLog={auditLog as unknown as AuditLogEntry[]}
      currentUserId={session.user.id}
    />
  );
}
