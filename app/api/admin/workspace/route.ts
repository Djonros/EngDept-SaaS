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
//  PATCH /api/admin/workspace — update name / company details / logo_url
//  owner only (branding feature check for details/logo)
// ============================================================================

import { NextRequest } from "next/server";
import { apiSession, unauthorized, forbidden } from "@/lib/api-auth";
import { updateWorkspace, writeAudit } from "@/lib/repo";
import { hasFeature } from "@/lib/plans";
import type { CompanyDetails } from "@/lib/types";

export async function PATCH(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!session.roles.includes("owner")) return forbidden();

  try {
    const body = (await request.json()) as {
      name?: string;
      companyDetails?: CompanyDetails;
    };

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return Response.json({ error: "Название не может быть пустым" }, { status: 400 });
      }
      updateWorkspace(session.workspace.id, { name: body.name.trim() });
      writeAudit(session.workspace.id, session.user.id, "workspace.renamed", "workspace", session.workspace.id);
    }

    if (body.companyDetails !== undefined) {
      if (!hasFeature(session.workspace.plan, "branding")) {
        return Response.json(
          { error: "Реквизиты доступны на тарифе Enterprise" },
          { status: 402 }
        );
      }
      updateWorkspace(session.workspace.id, { company_details: body.companyDetails });
      writeAudit(session.workspace.id, session.user.id, "workspace.company_details", "workspace", session.workspace.id);
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
