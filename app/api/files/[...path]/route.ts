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
//  GET /api/files/[...path] — serves uploaded files (logos) from data/uploads
//  Path traversal safe.
// ============================================================================

import { NextRequest } from "next/server";
import { createReadStream, existsSync, statSync } from "fs";
import { join, resolve, sep } from "path";
import { Readable } from "stream";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
  webp: "image/webp",
};

function uploadsRoot(): string {
  const env = process.env.DATA_DIR;
  const base = env && env.trim() ? env : join(process.cwd(), "data");
  return resolve(join(base, "uploads"));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const root = uploadsRoot();
  const target = resolve(join(root, ...params.path));

  if (!target.startsWith(root + sep) || !existsSync(target) || !statSync(target).isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const ext = target.split(".").pop()?.toLowerCase() ?? "";
  const stream = Readable.toWeb(createReadStream(target)) as ReadableStream;

  return new Response(stream, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
