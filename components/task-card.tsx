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
//  TaskCard — compact card for kanban columns and list views
// ============================================================================

import { Calendar, Link2, AlertCircle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STAGE_LABELS, type TaskWithRelations } from "@/lib/types";

interface TaskCardProps {
  task: TaskWithRelations;
  onClick?: () => void;
  className?: string;
}

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const isOverdue =
    task.due_date && !task.completed_at && new Date(task.due_date) < new Date();

  const initials = task.assignee?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isOverdue && "border-destructive/50",
        className
      )}
    >
      {/* Title + stage badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2">
          {task.title}
        </h4>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {STAGE_LABELS[task.stage]}
        </Badge>
      </div>

      {/* Project name */}
      {task.project && (
        <p className="mb-2 text-xs text-muted-foreground">{task.project.title}</p>
      )}

      {/* Footer: assignee, due date, cost */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {task.assignee && (
            <Avatar className="h-6 w-6">
              {task.assignee.avatar_url && (
                <AvatarImage src={task.assignee.avatar_url} />
              )}
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
          )}
          {isOverdue && (
            <span className="flex items-center gap-0.5 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
            </span>
          )}
          {task.rework_count > 0 && (
            <span className="text-xs text-amber-600">
              ↻{task.rework_count}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.due_date && (
            <span className={cn("flex items-center gap-0.5", isOverdue && "text-destructive")}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.due_date)}
            </span>
          )}
          {task.yandex_disk_link && (
            <Link2 className="h-3 w-3" />
          )}
          {task.cost !== null && task.cost > 0 && (
            <span className="font-medium text-foreground">
              {formatCurrency(task.cost)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
