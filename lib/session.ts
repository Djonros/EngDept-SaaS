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
//  Session helper — gets current user + workspace in Server Components
// ============================================================================

import { redirect } from "next/navigation";
import type { User, Workspace, UserRole } from "./types";
import { createServerClient } from "./supabase-server";

export interface Session {
  user: User;
  workspace: Workspace;
  role: UserRole;
}

export async function getSession(): Promise<Session | null> {
  const supabase = createServerClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!user || !user.is_active) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", user.workspace_id)
    .single();

  if (!workspace) return null;

  return {
    user: user as User,
    workspace: workspace as Workspace,
    role: user.role,
  };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// Freelancers see only their own tasks
export async function requireStaffSession(): Promise<Session> {
  const session = await requireSession();
  if (session.role === "freelancer") redirect("/my-tasks");
  return session;
}
