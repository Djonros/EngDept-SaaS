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
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-client";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  type TaskStage,
  type TaskWithRelations,
} from "@/lib/types";

export interface TaskFormOptions {
  projects: { id: string; title: string }[];
  milestones: { id: string; title: string; project_id: string }[];
  users: { id: string; name: string }[];
}

interface TaskFormDialogProps {
  mode: "create" | "edit";
  task?: TaskWithRelations;
  workspaceId: string;
  defaultProjectId?: string;
  options: TaskFormOptions;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const NONE = "none";

function toVal(v: string | null | undefined): string {
  return v ?? NONE;
}

function fromVal(v: string): string | null {
  return v === NONE ? null : v;
}

export function TaskFormDialog({
  mode,
  task,
  workspaceId,
  defaultProjectId,
  options,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: TaskFormDialogProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState(
    task?.project_id ?? defaultProjectId ?? options.projects[0]?.id ?? NONE
  );
  const [milestoneId, setMilestoneId] = useState(toVal(task?.milestone_id));
  const [stage, setStage] = useState<TaskStage>(task?.stage ?? "brief");
  const [assigneeId, setAssigneeId] = useState(toVal(task?.assignee_id));
  const [reviewerId, setReviewerId] = useState(toVal(task?.reviewer_id));
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [cost, setCost] = useState(
    task?.cost != null ? String(task.cost) : ""
  );
  const [diskLink, setDiskLink] = useState(task?.yandex_disk_link ?? "");
  const [saving, setSaving] = useState(false);

  const filteredMilestones = options.milestones.filter(
    (m) => m.project_id === projectId
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название задачи");
      return;
    }
    if (projectId === NONE) {
      toast.error("Выберите проект");
      return;
    }

    setSaving(true);
    const supabase = createBrowserClient();

    const payload = {
      workspace_id: workspaceId,
      project_id: projectId,
      milestone_id: fromVal(milestoneId),
      stage,
      title: title.trim(),
      description: description.trim() || null,
      assignee_id: fromVal(assigneeId),
      reviewer_id: fromVal(reviewerId),
      due_date: dueDate || null,
      cost: cost ? Number(cost) : 0,
      yandex_disk_link: diskLink.trim() || null,
    };

    if (mode === "create") {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) {
        toast.error("Ошибка создания задачи: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Задача создана");
    } else {
      const { error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", task!.id);
      if (error) {
        toast.error("Ошибка обновления: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Задача обновлена");
    }

    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Новая задача" : "Редактировать задачу"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Заполните поля для создания новой задачи"
              : "Измените параметры задачи"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Название *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Напр.: Разработка 3D-модели узла"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Описание</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Технические требования, примечания..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Проект *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите проект" />
                </SelectTrigger>
                <SelectContent>
                  {options.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Стадия</Label>
              <Select
                value={stage}
                onValueChange={(v) => setStage(v as TaskStage)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Этап (milestone)</Label>
              <Select value={milestoneId} onValueChange={setMilestoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Не выбрано" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {filteredMilestones.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {options.users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Нормоконтролёр</Label>
              <Select value={reviewerId} onValueChange={setReviewerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {options.users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due">Срок</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-cost">Стоимость (₽)</Label>
              <Input
                id="task-cost"
                type="number"
                min="0"
                step="100"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-disk">Ссылка на Яндекс.Диск</Label>
              <Input
                id="task-disk"
                type="url"
                value={diskLink}
                onChange={(e) => setDiskLink(e.target.value)}
                placeholder="https://disk.yandex.ru/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Создать" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
