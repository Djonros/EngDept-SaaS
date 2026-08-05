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

import Link from "next/link";
import { requireSession } from "@/lib/session";
import { createServerClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, FolderKanban } from "lucide-react";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import {
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<ProjectStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  on_hold: "secondary",
  completed: "secondary",
  cancelled: "destructive",
};

interface ProjectWithStats extends Project {
  taskCount: number;
  doneCount: number;
}

export default async function ProjectsPage() {
  const session = await requireSession();
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const [{ data: projects }, { data: taskStats }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("project_id, stage")
      .eq("workspace_id", wid),
  ]);

  const list: ProjectWithStats[] = (projects ?? []).map((p) => {
    const pt = (taskStats ?? []).filter((t) => t.project_id === p.id);
    return {
      ...(p as Project),
      taskCount: pt.length,
      doneCount: pt.filter((t) => t.stage === "done").length,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Проекты</h1>
          <p className="text-muted-foreground">Управление проектами отдела</p>
        </div>
        <ProjectFormDialog
          mode="create"
          workspaceId={wid}
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Новый проект
            </Button>
          }
        />
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Проектов пока нет. Создайте первый проект.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight line-clamp-2">
                      {p.title}
                    </h3>
                    <Badge variant={STATUS_VARIANT[p.status]} className="shrink-0">
                      {PROJECT_STATUS_LABELS[p.status]}
                    </Badge>
                  </div>

                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {p.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {p.taskCount > 0 && (
                      <span>
                        Задач:{" "}
                        <span className="font-medium text-foreground">
                          {p.doneCount}/{p.taskCount}
                        </span>
                      </span>
                    )}
                    {p.budget != null && p.budget > 0 && (
                      <span>{formatCurrency(p.budget)}</span>
                    )}
                    {p.target_date && (
                      <span>{formatDate(p.target_date)}</span>
                    )}
                  </div>

                  <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary">
                    Открыть
                    <ChevronRight className="ml-0.5 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
