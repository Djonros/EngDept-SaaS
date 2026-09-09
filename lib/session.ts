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
//  Session helper — reads own cookie session in Server Components
// ============================================================================

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionByToken, SESSION_COOKIE, type SessionData } from "./auth";

export type Session = SessionData;

export async function getSession(): Promise<Session | null> {
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return getSessionByToken(token);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// Freelancers see only their own tasks
export async function requireStaffSession(): Promise<Session> {
  const session = await requireSession();
  if (session.roles.includes("freelancer") && session.roles.length === 1)
    redirect("/my-tasks");
  return session;
}
