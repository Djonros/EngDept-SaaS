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
import { createBrowserClient } from "@/lib/supabase-client";
import { toast } from "@/components/ui/toast";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import type { TaskFormOptions } from "@/components/task-form-dialog";
import {
  STAGE_LABELS,
  type TaskStage,
  type TaskWithRelations,
} from "@/lib/types";

interface MyTasksViewProps {
  tasks: TaskWithRelations[];
  workspaceId: string;
  options: TaskFormOptions;
}

export function MyTasksView({ tasks, workspaceId, options }: MyTasksViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      <div>
        <h1 className="text-2xl font-bold">Мои задачи</h1>
        <p className="text-muted-foreground">
          Задачи, назначенные вам ({tasks.length})
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            Вам пока не назначено ни одной задачи
          </p>
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={(t) => setSelectedId(t.id)}
          onTaskMove={handleTaskMove}
        />
      )}

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
