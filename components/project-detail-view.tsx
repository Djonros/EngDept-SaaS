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
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  ListTodo,
  Milestone as MilestoneIcon,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-client";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskFormDialog, type TaskFormOptions } from "@/components/task-form-dialog";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import {
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
  type TaskStage,
  type TaskWithRelations,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<ProjectStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  on_hold: "secondary",
  completed: "secondary",
  cancelled: "destructive",
};

interface ProjectDetailViewProps {
  project: Project;
  tasks: TaskWithRelations[];
  milestones: { id: string; title: string; project_id: string }[];
  workspaceId: string;
  options: TaskFormOptions;
}

export function ProjectDetailView({
  project,
  tasks,
  milestones,
  workspaceId,
  options,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");
  const [milestoneBusy, setMilestoneBusy] = useState(false);

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;
  const doneCount = tasks.filter((t) => t.stage === "done").length;

  async function handleTaskMove(taskId: string, newStage: TaskStage) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.stage === newStage) return;
    const supabase = createBrowserClient();
    const update: Record<string, unknown> = { stage: newStage };
    if (newStage === "done") update.completed_at = new Date().toISOString();
    if (task.stage === "done" && newStage !== "done")
      update.completed_at = null;
    const { error } = await supabase.from("tasks").update(update).eq("id", taskId);
    if (error) {
      toast.error("Ошибка: " + error.message);
      return;
    }
    router.refresh();
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    setMilestoneBusy(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.from("milestones").insert({
      project_id: project.id,
      title: newMilestone.trim(),
      order_index: milestones.length,
    });
    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Этап добавлен");
      setNewMilestone("");
      router.refresh();
    }
    setMilestoneBusy(false);
  }

  async function deleteMilestone(id: string) {
    const supabase = createBrowserClient();
    const { error } = await supabase.from("milestones").delete().eq("id", id);
    if (error) {
      toast.error("Ошибка: " + error.message);
      return;
    }
    toast.success("Этап удалён");
    router.refresh();
  }

  const formOptions: TaskFormOptions = {
    ...options,
    projects: [{ id: project.id, title: project.title }],
    milestones,
  };

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Все проекты
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <Badge variant={STATUS_VARIANT[project.status]}>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditProjectOpen(true)}>
            <Pencil className="mr-1 h-4 w-4" />
            Редактировать
          </Button>
          <Button size="sm" onClick={() => setCreateTaskOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Новая задача
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2 text-sm">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Задач:</span>
          <span className="font-medium">
            {doneCount}/{tasks.length}
          </span>
        </div>
        {project.budget != null && project.budget > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Бюджет:</span>
            <span className="font-medium">{formatCurrency(project.budget)}</span>
          </div>
        )}
        {project.target_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Срок:</span>
            <span className="font-medium">{formatDate(project.target_date)}</span>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MilestoneIcon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Этапы</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-1.5 rounded-md border bg-card px-3 py-1.5 text-sm"
            >
              {m.title}
              <button
                onClick={() => deleteMilestone(m.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {milestones.length === 0 && (
            <p className="text-xs text-muted-foreground">Этапов нет</p>
          )}
        </div>
        <form onSubmit={addMilestone} className="flex gap-2">
          <Input
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            placeholder="Название этапа..."
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" size="sm" disabled={milestoneBusy}>
            {milestoneBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      <Separator />

      {/* Kanban */}
      <KanbanBoard
        tasks={tasks}
        onTaskClick={(t) => setSelectedId(t.id)}
        onTaskMove={handleTaskMove}
      />

      {/* Dialogs */}
      <TaskFormDialog
        mode="create"
        workspaceId={workspaceId}
        options={formOptions}
        defaultProjectId={project.id}
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(o) => !o && setSelectedId(null)}
        workspaceId={workspaceId}
        options={formOptions}
      />

      <ProjectFormDialog
        mode="edit"
        project={project}
        workspaceId={workspaceId}
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
      />
    </div>
  );
}
