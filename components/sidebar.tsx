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
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Wallet,
  ClipboardCheck,
  LogOut,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { UserRole, Plan } from "@/lib/types";
import { rolesLabel } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const STAFF_NAV: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard, roles: ["owner", "manager", "engineer", "reviewer"] },
  { label: "Проекты", href: "/projects", icon: FolderKanban, roles: ["owner", "manager", "engineer", "reviewer"] },
  { label: "Задачи", href: "/tasks", icon: ListTodo, roles: ["owner", "manager", "engineer", "reviewer"] },
  { label: "Каталог цен", href: "/catalog", icon: DollarSign, roles: ["owner", "manager"] },
  { label: "Аналитика", href: "/analytics", icon: BarChart3, roles: ["owner", "manager"] },
  { label: "СТП / Чек-листы", href: "/stp", icon: ClipboardCheck, roles: ["owner", "manager", "reviewer"] },
  { label: "Администрирование", href: "/admin", icon: ShieldCheck, roles: ["owner"] },
];

const FREELANCER_NAV: NavItem[] = [
  { label: "Дашборд", href: "/dashboard", icon: LayoutDashboard, roles: ["freelancer"] },
  { label: "Мои задачи", href: "/my-tasks", icon: ListTodo, roles: ["freelancer"] },
  { label: "Мой кошелёк", href: "/my-wallet", icon: Wallet, roles: ["freelancer"] },
];

interface SidebarProps {
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
  onSignOut?: () => void;
}

export function Sidebar({ user, workspace, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const roles = user.roles.length > 0 ? user.roles : (["engineer"] as UserRole[]);
  const isFreelancerOnly =
    roles.length === 1 && roles[0] === "freelancer";

  const ALL_NAV = [
    ...STAFF_NAV,
    ...FREELANCER_NAV.filter(
      (item) => !STAFF_NAV.some((s) => s.href === item.href)
    ),
  ];
  const navItems = (isFreelancerOnly ? FREELANCER_NAV : ALL_NAV).filter(
    (item) => item.roles.some((r) => roles.includes(r))
  );

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Workspace header */}
      <div className="flex items-center gap-3 p-4">
        {workspace.logo_url ? (
          <Image
            src={workspace.logo_url}
            alt={workspace.name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                workspace.plan === "enterprise" ? "bg-purple-500" : workspace.plan === "pro" ? "bg-blue-500" : "bg-gray-400"
              )}
            />
            <span className="text-xs text-muted-foreground capitalize">{workspace.plan}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems
          .map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
      </nav>

      <Separator />

      {/* User footer */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-9 w-9">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.name} />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{rolesLabel(user.roles)}</p>
          </div>
        </div>
        {onSignOut && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start text-muted-foreground"
            onClick={onSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        )}
      </div>
    </aside>
  );
}
