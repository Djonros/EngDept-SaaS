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
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/types";

interface ProjectFormDialogProps {
  mode: "create" | "edit";
  project?: Pick<Project, "id" | "title" | "description" | "budget" | "target_date" | "status">;
  workspaceId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const STATUSES: ProjectStatus[] = ["active", "on_hold", "completed", "cancelled"];

export function ProjectFormDialog({
  mode,
  project,
  workspaceId,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: ProjectFormDialogProps) {
  const router = useRouter();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [budget, setBudget] = useState(
    project?.budget != null ? String(project.budget) : ""
  );
  const [targetDate, setTargetDate] = useState(project?.target_date ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "active");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название проекта");
      return;
    }

    setSaving(true);
    const supabase = createBrowserClient();

    const payload = {
      workspace_id: workspaceId,
      title: title.trim(),
      description: description.trim() || null,
      budget: budget ? Number(budget) : 0,
      target_date: targetDate || null,
      status,
    };

    if (mode === "create") {
      const { data, error } = await supabase
        .from("projects")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        toast.error("Ошибка: " + error.message);
        setSaving(false);
        return;
      }
      toast.success("Проект создан");
      setSaving(false);
      setOpen(false);
      router.push(`/projects/${data.id}`);
      return;
    }

    const { error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", project!.id);
    if (error) {
      toast.error("Ошибка: " + error.message);
      setSaving(false);
      return;
    }
    toast.success("Проект обновлён");
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Новый проект" : "Редактировать проект"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Создайте новый проект отдела"
              : "Измените параметры проекта"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="proj-title">Название *</Label>
            <Input
              id="proj-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Напр.: Разработка конвейерной линии"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-desc">Описание</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание проекта..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="proj-budget">Бюджет (₽)</Label>
              <Input
                id="proj-budget"
                type="number"
                min="0"
                step="10000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-date">Срок</Label>
              <Input
                id="proj-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Статус</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProjectStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
