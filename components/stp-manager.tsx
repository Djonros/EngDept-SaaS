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
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  type TaskStage,
  type StpChecklistItem,
} from "@/lib/types";

interface StpManagerProps {
  checklists: Record<TaskStage, StpChecklistItem[]>;
  workspaceId: string;
}

export function StpManager({ checklists }: StpManagerProps) {
  const router = useRouter();
  const [activeStage, setActiveStage] = useState<TaskStage>(STAGE_ORDER[0]);
  const [items, setItems] = useState(checklists);
  const [newLabel, setNewLabel] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [saving, setSaving] = useState(false);

  function addItem(stage: TaskStage) {
    if (!newLabel.trim()) return;
    const item: StpChecklistItem = {
      id: crypto.randomUUID(),
      label: newLabel.trim(),
      required: newRequired,
    };
    const updated = { ...items, [stage]: [...items[stage], item] };
    setItems(updated);
    setNewLabel("");
    setNewRequired(false);
    void saveStage(stage, updated[stage]);
  }

  function removeItem(stage: TaskStage, id: string) {
    const updated = {
      ...items,
      [stage]: items[stage].filter((i) => i.id !== id),
    };
    setItems(updated);
    void saveStage(stage, updated[stage]);
  }

  function toggleRequired(stage: TaskStage, id: string) {
    const updated = {
      ...items,
      [stage]: items[stage].map((i) =>
        i.id === id ? { ...i, required: !i.required } : i
      ),
    };
    setItems(updated);
    void saveStage(stage, updated[stage]);
  }

  function updateLabel(stage: TaskStage, id: string, label: string) {
    setItems((prev) => ({
      ...prev,
      [stage]: prev[stage].map((i) => (i.id === id ? { ...i, label } : i)),
    }));
  }

  async function saveStage(stage: TaskStage, stageItems: StpChecklistItem[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/stp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, items: stageItems }),
      });
      const data = await res.json();
      if (!res.ok) toast.error("Ошибка: " + (data.error || "неизвестная"));
    } catch {
      toast.error("Ошибка сети");
    }
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">СТП — Чек-листы нормоконтроля</h1>
        <p className="text-muted-foreground">
          Пункты стандартов для проверки по стадиям проектирования
        </p>
      </div>

      <Tabs value={activeStage} onValueChange={(v) => setActiveStage(v as TaskStage)}>
        <TabsList className="flex-wrap">
          {STAGE_ORDER.map((stage) => (
            <TabsTrigger key={stage} value={stage} className="gap-1.5">
              {STAGE_LABELS[stage]}
              <Badge variant="secondary" className="text-xs">
                {items[stage]?.length ?? 0}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {STAGE_ORDER.map((stage) => (
          <TabsContent key={stage} value={stage}>
            <Card>
              <CardContent className="space-y-3 pt-6">
                {/* Add new item */}
                <div className="flex items-center gap-3">
                  <Input
                    value={activeStage === stage ? newLabel : ""}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addItem(stage);
                      }
                    }}
                    placeholder="Новый пункт чек-листа..."
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <Checkbox
                      checked={activeStage === stage ? newRequired : false}
                      onCheckedChange={(v) => setNewRequired(v === true)}
                    />
                    Обязательный
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addItem(stage)}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  {(items[stage] ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Checkbox
                        checked={item.required}
                        onCheckedChange={() => toggleRequired(stage, item.id)}
                      />
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateLabel(stage, item.id, e.target.value)
                        }
                        onBlur={() => saveStage(stage, items[stage])}
                        className="flex-1"
                      />
                      {item.required && (
                        <Badge variant="destructive" className="text-xs">
                          Обязательный
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(stage, item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {(items[stage] ?? []).length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Чек-лист пуст. Добавьте пункты для проверки.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
