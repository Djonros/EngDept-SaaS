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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-client";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskFormDialog, type TaskFormOptions } from "@/components/task-form-dialog";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import {
  STAGE_LABELS,
  type TaskStage,
  type TaskWithRelations,
} from "@/lib/types";

interface TasksBoardProps {
  tasks: TaskWithRelations[];
  workspaceId: string;
  options: TaskFormOptions;
}

const ALL_PROJECTS = "all";

export function TasksBoard({ tasks, workspaceId, options }: TasksBoardProps) {
  const router = useRouter();
  const [projectFilter, setProjectFilter] = useState(ALL_PROJECTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered =
    projectFilter === ALL_PROJECTS
      ? tasks
      : tasks.filter((t) => t.project_id === projectFilter);

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;

  async function handleTaskMove(taskId: string, newStage: TaskStage) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.stage === newStage) return;

    const supabase = createBrowserClient();
    const update: Record<string, unknown> = { stage: newStage };
    if (newStage === "done") update.completed_at = new Date().toISOString();
    if (task.stage === "done" && newStage !== "done")
      update.completed_at = null;

    const { error } = await supabase
      .from("tasks")
      .update(update)
      .eq("id", taskId);

    if (error) {
      toast.error("Ошибка перемещения: " + error.message);
      return;
    }
    toast.success(`${STAGE_LABELS[newStage]}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Задачи</h1>
          <p className="text-muted-foreground">
            Kanban-доска по стадиям СТП
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PROJECTS}>Все проекты</SelectItem>
              {options.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Новая задача
          </Button>
        </div>
      </div>

      <KanbanBoard
        tasks={filtered}
        onTaskClick={(t) => setSelectedId(t.id)}
        onTaskMove={handleTaskMove}
      />

      <TaskFormDialog
        mode="create"
        workspaceId={workspaceId}
        options={options}
        defaultProjectId={
          projectFilter !== ALL_PROJECTS ? projectFilter : undefined
        }
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(o) => {
          if (!o) setSelectedId(null);
        }}
        workspaceId={workspaceId}
        options={options}
      />
    </div>
  );
}
