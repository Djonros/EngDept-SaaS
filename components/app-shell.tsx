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

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-client";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import type { UserRole, Plan } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    avatar_url: string | null;
    roles: UserRole[];
  };
  workspace: {
    name: string;
    logo_url: string | null;
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
        {workspace.plan === "free" && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/50 px-6 py-2">
            <p className="text-sm text-muted-foreground">
              Вы на бесплатном тарифе: до 3 пользователей и 3 проектов,
              часть разделов закрыта.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/pricing">
                <Sparkles className="mr-2 h-4 w-4" />
                Улучшить тариф
              </Link>
            </Button>
          </div>
        )}
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
