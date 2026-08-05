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
//  POST /api/license-check
//  Runtime license validation endpoint (called by client on app load)
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { validateLicense } from "@/lib/license-validator";

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, hardwareId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json({ valid: false, reason: "workspaceId required" }, { status: 400 });
    }

    const result = await validateLicense(workspaceId, hardwareId || "");

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ valid: false, reason: "Internal error" }, { status: 500 });
  }
}
