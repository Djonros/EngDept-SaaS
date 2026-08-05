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
import {
  Loader2,
  ExternalLink,
  Pencil,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User as UserIcon,
  Eye,
  Clock,
  RefreshCw,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-client";
import { toast } from "@/components/ui/toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskFormDialog, type TaskFormOptions } from "@/components/task-form-dialog";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  type TaskWithRelations,
} from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface TaskDetailSheetProps {
  task: TaskWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  options: TaskFormOptions;
}

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  workspaceId,
  options,
}: TaskDetailSheetProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!task) return null;

  const stageIdx = STAGE_ORDER.indexOf(task.stage);
  const canAdvance = stageIdx < STAGE_ORDER.length - 1;
  const canGoBack = stageIdx > 0;

  async function moveStage(direction: 1 | -1) {
    if (!task) return;
    setBusy(true);
    const supabase = createBrowserClient();
    const newIdx = stageIdx + direction;
    const newStage = STAGE_ORDER[newIdx];

    const update: Record<string, unknown> = { stage: newStage };
    if (newStage === "done") update.completed_at = new Date().toISOString();
    if (task.stage === "done" && direction === -1) update.completed_at = null;
    if (direction === -1) update.rework_count = task.rework_count + 1;

    const { error } = await supabase.from("tasks").update(update).eq("id", task.id);

    if (error) {
      toast.error("Ошибка: " + error.message);
      setBusy(false);
      return;
    }

    toast.success(
      direction === 1
        ? `Перемещено: ${STAGE_LABELS[newStage]}`
        : `Возврат: ${STAGE_LABELS[newStage]}`
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{STAGE_LABELS[task.stage]}</Badge>
              {task.rework_count > 0 && (
                <Badge variant="outline" className="text-amber-600">
                  <RefreshCw className="mr-1 h-3 w-3" />
                  {task.rework_count}
                </Badge>
              )}
            </div>
            <SheetTitle className="text-xl">{task.title}</SheetTitle>
            <SheetDescription className="sr-only">
              Детали задачи
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-1">
            {task.project && (
              <MetaRow icon={Eye} label="Проект">
                <span className="font-medium">{task.project.title}</span>
              </MetaRow>
            )}

            {task.milestone && (
              <MetaRow icon={ChevronRight} label="Этап">
                {task.milestone.title}
              </MetaRow>
            )}

            {task.assignee && (
              <MetaRow icon={UserIcon} label="Исполнитель">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {task.assignee.avatar_url && (
                      <AvatarImage src={task.assignee.avatar_url} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {initials(task.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assignee.name}</span>
                </div>
              </MetaRow>
            )}

            {task.reviewer && (
              <MetaRow icon={Eye} label="Нормоконтролёр">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {task.reviewer.avatar_url && (
                      <AvatarImage src={task.reviewer.avatar_url} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {initials(task.reviewer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.reviewer.name}</span>
                </div>
              </MetaRow>
            )}

            {task.due_date && (
              <MetaRow icon={Calendar} label="Срок">
                <span
                  className={cn(
                    new Date(task.due_date) < new Date() &&
                      !task.completed_at &&
                      "text-destructive font-medium"
                  )}
                >
                  {formatDate(task.due_date)}
                </span>
              </MetaRow>
            )}

            {task.cost != null && task.cost > 0 && (
              <MetaRow icon={Clock} label="Стоимость">
                <span className="font-semibold">{formatCurrency(task.cost)}</span>
              </MetaRow>
            )}

            {task.completed_at && (
              <MetaRow icon={Calendar} label="Завершено">
                {formatDate(task.completed_at)}
              </MetaRow>
            )}
          </div>

          {task.description && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Описание</p>
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              </div>
            </>
          )}

          {task.yandex_disk_link && (
            <>
              <Separator className="my-4" />
              <Button asChild variant="outline" className="w-full">
                <a
                  href={task.yandex_disk_link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Открыть на Яндекс.Диске
                </a>
              </Button>
            </>
          )}

          <Separator className="my-4" />

          {/* Stage controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canGoBack || busy}
              onClick={() => moveStage(-1)}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Редактировать
            </Button>
            <Button
              size="sm"
              className="ml-auto"
              disabled={!canAdvance || busy}
              onClick={() => moveStage(1)}
            >
              {canAdvance
                ? `${STAGE_LABELS[STAGE_ORDER[stageIdx + 1]]}`
                : "Готово"}
              {canAdvance && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <TaskFormDialog
        mode="edit"
        task={task}
        workspaceId={workspaceId}
        options={options}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
