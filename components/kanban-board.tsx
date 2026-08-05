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
//  KanbanBoard — renders tasks grouped by stage (СТП pipeline) with DnD
// ============================================================================

"use client";

import { useState } from "react";
import { STAGE_ORDER, STAGE_LABELS, type TaskStage, type TaskWithRelations } from "@/lib/types";
import { TaskCard } from "@/components/task-card";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onTaskClick?: (task: TaskWithRelations) => void;
  onTaskMove?: (taskId: string, newStage: TaskStage) => void;
}

export function KanbanBoard({ tasks, onTaskClick, onTaskMove }: KanbanBoardProps) {
  const dnd = !!onTaskMove;
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<TaskStage | null>(null);

  const grouped = STAGE_ORDER.reduce(
    (acc, stage) => {
      acc[stage] = tasks.filter((t) => t.stage === stage);
      return acc;
    },
    {} as Record<TaskStage, TaskWithRelations[]>
  );

  function handleDragStart(e: React.DragEvent, taskId: string) {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }

  function handleDrop(e: React.DragEvent, stage: TaskStage) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id && onTaskMove) onTaskMove(id, stage);
    setDraggedId(null);
    setOverStage(null);
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGE_ORDER.map((stage) => (
        <div
          key={stage}
          className="flex w-72 shrink-0 flex-col"
          onDragOver={(e) => {
            if (!dnd) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setOverStage(stage);
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setOverStage((s) => (s === stage ? null : s));
          }}
          onDrop={(e) => handleDrop(e, stage)}
        >
          {/* Column header */}
          <div
            className={cn(
              "mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2 transition-all",
              overStage === stage && "ring-2 ring-primary ring-offset-1"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: `var(--kanban-${stage})` }}
              />
              <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
            </div>
            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {grouped[stage]?.length || 0}
            </span>
          </div>

          {/* Column body */}
          <div className="flex flex-1 flex-col gap-2">
            {grouped[stage]?.map((task) => (
              <div
                key={task.id}
                draggable={dnd}
                onDragStart={dnd ? (e) => handleDragStart(e, task.id) : undefined}
                className={cn(
                  dnd && "cursor-grab active:cursor-grabbing",
                  draggedId === task.id && "opacity-40"
                )}
              >
                <TaskCard
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                />
              </div>
            ))}
            {grouped[stage]?.length === 0 && (
              <div className="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed">
                <span className="text-xs text-muted-foreground">Пусто</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
