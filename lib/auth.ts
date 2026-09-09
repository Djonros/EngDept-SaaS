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
//  Own authentication — scrypt password hashing + DB-backed sessions
//  in an httpOnly cookie. Server-only.
// ============================================================================

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";
import { getDb, newId } from "./db";
import type { User, UserRole, Workspace } from "./types";

export const SESSION_COOKIE = "engdept_session";
const SESSION_TTL_DAYS = 30;

const SECRET =
  process.env.SESSION_SECRET ??
  process.env.LICENSE_ENCRYPTION_KEY ??
  "dev-session-secret-change-me";

// ---- Password hashing (scrypt) ----
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

// ---- Session tokens (id + HMAC signature, verifiable without DB) ----
function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function createSessionToken(): { token: string; id: string } {
  const id = newId();
  const token = `${id}.${sign(id)}`;
  return { token, id };
}

export function verifySessionToken(token: string): string | null {
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const expected = sign(id);
  return expected.length === sig.length && timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    ? id
    : null;
}

// ---- DB-backed sessions ----
export function createSession(userId: string): string {
  const db = getDb();
  const { token, id } = createSessionToken();
  const expires = new Date(Date.now() + SESSION_TTL_DAYS * 86400000).toISOString();
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
  ).run(id, userId, expires);
  return token;
}

export function destroySession(token: string): void {
  const id = verifySessionToken(token);
  if (!id) return;
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(id);
}

export interface SessionData {
  user: User;
  workspace: Workspace;
  role: UserRole;
  roles: UserRole[];
}

export function getSessionByToken(token: string | undefined | null): SessionData | null {
  if (!token) return null;
  const id = verifySessionToken(token);
  if (!id) return null;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.expires_at, u.id as user_id
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`
    )
    .get(id) as { expires_at: string; user_id: string } | undefined;

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(id);
    return null;
  }

  const userRow = db
    .prepare(
      `SELECT u.*, w.id AS ws_id, w.name AS ws_name, w.plan AS ws_plan,
              w.license_key AS ws_license_key, w.max_users AS ws_max_users,
              w.max_projects AS ws_max_projects, w.company_details AS ws_company_details,
              w.logo_url AS ws_logo_url, w.expires_at AS ws_expires_at,
              w.created_at AS ws_created_at
       FROM users u JOIN workspaces w ON w.id = u.workspace_id
       WHERE u.id = ?`
    )
    .get(row.user_id) as Record<string, unknown> | undefined;

  if (!userRow || userRow.is_active !== 1) return null;

  const user: User = {
    id: userRow.id as string,
    workspace_id: userRow.workspace_id as string,
    name: userRow.name as string,
    email: userRow.email as string,
    role: userRow.role as UserRole,
    roles: JSON.parse(userRow.roles as string) as UserRole[],
    telegram_id: (userRow.telegram_id as string | null) ?? null,
    avatar_url: (userRow.avatar_url as string | null) ?? null,
    is_active: true,
    created_at: userRow.created_at as string,
  };

  const workspace: Workspace = {
    id: userRow.ws_id as string,
    name: userRow.ws_name as string,
    logo_url: (userRow.ws_logo_url as string | null) ?? null,
    company_details: JSON.parse(userRow.ws_company_details as string),
    plan: userRow.ws_plan as Workspace["plan"],
    license_key: (userRow.ws_license_key as string | null) ?? null,
    max_users: userRow.ws_max_users as number,
    max_projects: (userRow.ws_max_projects as number | null) ?? null,
    expires_at: (userRow.ws_expires_at as string | null) ?? null,
    created_at: userRow.ws_created_at as string,
  };

  return {
    user,
    workspace,
    role: user.role,
    roles: user.roles.length > 0 ? user.roles : [user.role],
  };
}

export function sessionCookieOptions(maxAgeSeconds = SESSION_TTL_DAYS * 86400) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
    secure: process.env.COOKIE_SECURE === "1",
  };
}
