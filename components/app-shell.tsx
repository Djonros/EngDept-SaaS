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

"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase-client";
import { Sidebar } from "@/components/sidebar";
import type { UserRole, Plan } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    avatar_url: string | null;
    role: UserRole;
  };
  workspace: {
    name: string;
    plan: Plan;
  };
}

export function AppShell({ children, user, workspace }: AppShellProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} workspace={workspace} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
