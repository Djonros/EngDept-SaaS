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
//  ChecklistModal — modal for STP (нормоконтроль) checklists
//  Renders items from stp_checklists and lets reviewer check them off
// ============================================================================

"use client";

import { useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StpChecklistItem } from "@/lib/types";

interface ChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: string;
  taskTitle: string;
  items: StpChecklistItem[];
  onComplete?: (checkedIds: string[]) => void;
}

export function ChecklistModal({
  open,
  onOpenChange,
  stage,
  taskTitle,
  items,
  onComplete,
}: ChecklistModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const requiredItems = items.filter((i) => i.required);
  const checkedRequired = requiredItems.filter((i) => checked.has(i.id)).length;
  const allRequiredChecked = checkedRequired === requiredItems.length;

  function handleComplete() {
    onComplete?.(Array.from(checked));
    onOpenChange(false);
    setChecked(new Set());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <DialogTitle className="flex items-center gap-2">
            Чек-лист нормоконтроля
            <Badge variant="outline" className="capitalize">{stage}</Badge>
          </DialogTitle>
          <DialogDescription>
            Задача: {taskTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Checklist items */}
        <div className="max-h-[400px] space-y-2 overflow-y-auto">
          {items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Чек-лист не настроен для этой стадии
            </p>
          )}
          {items.map((item) => {
            const isChecked = checked.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                  isChecked ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950" : "hover:bg-muted"
                )}
              >
                {isChecked ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1">
                  {item.label}
                  {item.required && (
                    <span className="ml-1 text-xs text-destructive">*</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2">
          <div className="mr-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span>{checked.size} / {items.length} отмечено</span>
            {requiredItems.length > 0 && (
              <span className={cn(!allRequiredChecked && "text-amber-600")}>
                ({checkedRequired}/{requiredItems.length} обязательных)
              </span>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleComplete} disabled={!allRequiredChecked}>
            Подтвердить проверку
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
