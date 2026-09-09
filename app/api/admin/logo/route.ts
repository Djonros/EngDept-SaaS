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
//  POST /api/admin/logo — multipart upload → uploads/<wid>/logo.<ext>
//  DELETE /api/admin/logo — remove logo
//  owner only, branding feature (Enterprise)
// ============================================================================

import { NextRequest } from "next/server";
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { apiSession, unauthorized, forbidden } from "@/lib/api-auth";
import { updateWorkspace, writeAudit } from "@/lib/repo";
import { hasFeature } from "@/lib/plans";

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

function uploadsDir(): string {
  const env = process.env.DATA_DIR;
  const base = env && env.trim() ? env : join(process.cwd(), "data");
  const dir = join(base, "uploads");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export async function POST(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!session.roles.includes("owner")) return forbidden();

  if (!hasFeature(session.workspace.plan, "branding")) {
    return Response.json(
      { error: "Логотип доступен на тарифе Enterprise" },
      { status: 402 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return Response.json({ error: "Файл не передан" }, { status: 400 });

    if (file.size > 2 * 1024 * 1024) {
      return Response.json({ error: "Файл слишком большой (макс. 2 МБ)" }, { status: 400 });
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return Response.json({ error: "Допустимы PNG, JPG, SVG, WebP" }, { status: 400 });
    }

    const wid = session.workspace.id;
    const dir = join(uploadsDir(), wid);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, `logo.${ext}`);
    writeFileSync(path, Buffer.from(await file.arrayBuffer()));

    const logoUrl = `/api/files/${wid}/logo.${ext}`;
    updateWorkspace(wid, { logo_url: logoUrl });
    writeAudit(wid, session.user.id, "workspace.logo_updated", "workspace", wid);

    return Response.json({ success: true, logoUrl });
  } catch {
    return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = apiSession(request);
  if (!session) return unauthorized();
  if (!session.roles.includes("owner")) return forbidden();

  const wid = session.workspace.id;

  for (const ext of Object.values(ALLOWED_TYPES)) {
    const path = join(uploadsDir(), wid, `logo.${ext}`);
    if (existsSync(path)) unlinkSync(path);
  }

  updateWorkspace(wid, { logo_url: null });
  writeAudit(wid, session.user.id, "workspace.logo_removed", "workspace", wid);

  return Response.json({ success: true });
}
