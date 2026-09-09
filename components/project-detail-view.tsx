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
  Users,
  FileText,
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { KanbanBoard } from "@/components/kanban-board";
import { TaskFormDialog, type TaskFormOptions } from "@/components/task-form-dialog";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_MEMBER_ROLE_LABELS,
  type Project,
  type ProjectMemberRole,
  type ProjectMemberWithUser,
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
  members: ProjectMemberWithUser[];
  workspaceId: string;
  options: TaskFormOptions;
}

export function ProjectDetailView({
  project,
  tasks,
  milestones,
  members,
  workspaceId,
  options,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");
  const [milestoneBusy, setMilestoneBusy] = useState(false);
  const [memberBusy, setMemberBusy] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<ProjectMemberRole>("engineer");

  const selectedTask = tasks.find((t) => t.id === selectedId) ?? null;
  const doneCount = tasks.filter((t) => t.stage === "done").length;

  async function handleTaskMove(taskId: string, newStage: TaskStage) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.stage === newStage) return;
    const update: Record<string, unknown> = { stage: newStage };
    if (newStage === "done") update.completed_at = new Date().toISOString();
    if (task.stage === "done" && newStage !== "done")
      update.completed_at = null;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error("Ошибка: " + (data.error || "неизвестная"));
        return;
      }
      router.refresh();
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    setMilestoneBusy(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          title: newMilestone.trim(),
          orderIndex: milestones.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка: " + (data.error || "неизвестная"));
      } else {
        toast.success("Этап добавлен");
        setNewMilestone("");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
    }
    setMilestoneBusy(false);
  }

  async function deleteMilestone(id: string) {
    try {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error("Ошибка: " + (data.error || "неизвестная"));
        return;
      }
      toast.success("Этап удалён");
      router.refresh();
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberId) {
      toast.error("Выберите пользователя");
      return;
    }
    setMemberBusy(true);
    try {
      const res = await fetch("/api/project-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          userId: newMemberId,
          role: newMemberRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Ошибка: " + (data.error || "неизвестная"));
      } else {
        toast.success("Участник добавлен");
        setNewMemberId("");
        setNewMemberRole("engineer");
        router.refresh();
      }
    } catch {
      toast.error("Ошибка сети");
    }
    setMemberBusy(false);
  }

  async function removeMember(id: string) {
    try {
      const res = await fetch(`/api/project-members/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error("Ошибка: " + (data.error || "неизвестная"));
        return;
      }
      toast.success("Участник удалён");
      router.refresh();
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function changeMemberRole(id: string, role: ProjectMemberRole) {
    try {
      const res = await fetch(`/api/project-members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error("Ошибка: " + (data.error || "неизвестная"));
        return;
      }
      router.refresh();
    } catch {
      toast.error("Ошибка сети");
    }
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
          <Button variant="outline" size="sm" asChild>
            <a href={`/projects/${project.id}/payment-doc`} target="_blank">
              <FileText className="mr-1 h-4 w-4" />
              Документ на оплату
            </a>
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

      {/* Team */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Команда проекта</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm"
            >
              <span className="font-medium">{m.user_name}</span>
              <Select
                value={m.role}
                onValueChange={(v) => changeMemberRole(m.id, v as ProjectMemberRole)}
              >
                <SelectTrigger className="h-7 w-auto gap-1 border-none px-1 text-xs text-muted-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROJECT_MEMBER_ROLE_LABELS) as ProjectMemberRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {PROJECT_MEMBER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => removeMember(m.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-muted-foreground">Команда не назначена</p>
          )}
        </div>
        <form onSubmit={addMember} className="flex flex-wrap gap-2">
          <Select value={newMemberId} onValueChange={setNewMemberId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Выбрать пользователя..." />
            </SelectTrigger>
            <SelectContent>
              {options.users
                .filter((u) => !members.some((m) => m.user_id === u.id))
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={newMemberRole}
            onValueChange={(v) => setNewMemberRole(v as ProjectMemberRole)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PROJECT_MEMBER_ROLE_LABELS) as ProjectMemberRole[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {PROJECT_MEMBER_ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline" size="sm" disabled={memberBusy}>
            {memberBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span className="ml-1">Добавить</span>
          </Button>
        </form>
      </div>

      <Separator />
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
