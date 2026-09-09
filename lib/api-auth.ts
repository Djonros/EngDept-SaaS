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
//  API auth helper — reads session from request cookie
// ============================================================================

import { NextRequest } from "next/server";
import { getSessionByToken, SESSION_COOKIE, type SessionData } from "./auth";

export function apiSession(request: NextRequest): SessionData | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return getSessionByToken(token);
}

export function unauthorized() {
  return Response.json({ error: "Не авторизован" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Недостаточно прав" }, { status: 403 });
}

export function isManagerOrOwner(session: SessionData): boolean {
  return session.roles.includes("owner") || session.roles.includes("manager");
}
