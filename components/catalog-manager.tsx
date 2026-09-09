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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  UNIT_LABELS,
  APPLIES_TO_LABELS,
  type PriceCatalogItem,
  type PriceMultiplier,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CatalogManagerProps {
  items: PriceCatalogItem[];
  multipliers: PriceMultiplier[];
  workspaceId: string;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS);
const UNITS = Object.keys(UNIT_LABELS);
const APPLIES_TO = Object.keys(APPLIES_TO_LABELS);

// ===================== Catalog Item Dialog =====================
function ItemDialog({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: PriceCatalogItem | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(item?.operation_name ?? "");
  const [category, setCategory] = useState(item?.category ?? "general");
  const [price, setPrice] = useState(item ? String(item.base_price) : "");
  const [unit, setUnit] = useState(item?.unit ?? "pc");
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  function handleOpenChange(o: boolean) {
    if (o) {
      setName(item?.operation_name ?? "");
      setCategory(item?.category ?? "general");
      setPrice(item ? String(item.base_price) : "");
      setUnit(item?.unit ?? "pc");
    }
    onOpenChange(o);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      id: item?.id,
      operation_name: name.trim(),
      category,
      base_price: price ? Number(price) : 0,
      unit,
    };

    try {
      const res = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Ошибка");
      else toast.success(item ? "Обновлено" : "Добавлено");
    } catch {
      toast.error("Ошибка сети");
    }

    setSaving(false);
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? "Редактировать операцию" : "Новая операция"}
          </DialogTitle>
          <DialogDescription>Позиция каталога цен</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Название операции *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Напр.: 3D-моделирование сборочной единицы"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as PriceCatalogItem["category"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Единица</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as PriceCatalogItem["unit"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_LABELS[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-price">Базовая цена (₽)</Label>
            <Input
              id="cat-price"
              type="number"
              min="0"
              step="100"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {item ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Multiplier Dialog =====================
function MultiplierDialog({
  open,
  onOpenChange,
  multiplier,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  multiplier: PriceMultiplier | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(multiplier?.name ?? "");
  const [value, setValue] = useState(multiplier ? String(multiplier.value) : "1");
  const [appliesTo, setAppliesTo] = useState(multiplier?.applies_to ?? "all");
  const [saving, setSaving] = useState(false);

  function handleOpenChange(o: boolean) {
    if (o) {
      setName(multiplier?.name ?? "");
      setValue(multiplier ? String(multiplier.value) : "1");
      setAppliesTo(multiplier?.applies_to ?? "all");
    }
    onOpenChange(o);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const payload = {
      id: multiplier?.id,
      name: name.trim(),
      value: Number(value) || 1,
      applies_to: appliesTo,
    };

    try {
      const res = await fetch("/api/multipliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) toast.error(data.error || "Ошибка");
      else toast.success(multiplier ? "Обновлено" : "Добавлено");
    } catch {
      toast.error("Ошибка сети");
    }

    setSaving(false);
    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {multiplier ? "Редактировать множитель" : "Новый множитель"}
          </DialogTitle>
          <DialogDescription>Коэффициент к стоимости работ</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mult-name">Название *</Label>
            <Input
              id="mult-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Напр.: Срочность"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mult-value">Значение</Label>
              <Input
                id="mult-value"
                type="number"
                min="0.1"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Применяется к</Label>
              <Select value={appliesTo} onValueChange={(v) => setAppliesTo(v as PriceMultiplier["applies_to"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPLIES_TO.map((a) => (
                    <SelectItem key={a} value={a}>
                      {APPLIES_TO_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {multiplier ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Main Component =====================
export function CatalogManager({
  items,
  multipliers,
}: CatalogManagerProps) {
  const router = useRouter();
  const [itemOpen, setItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<PriceCatalogItem | null>(null);
  const [multOpen, setMultOpen] = useState(false);
  const [editMult, setEditMult] = useState<PriceMultiplier | null>(null);

  async function deleteItem(id: string) {
    try {
      const res = await fetch(`/api/catalog?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
        return;
      }
      toast.success("Удалено");
      router.refresh();
    } catch {
      toast.error("Ошибка сети");
    }
  }

  async function deleteMultiplier(id: string) {
    try {
      const res = await fetch(`/api/multipliers?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Ошибка");
        return;
      }
      toast.success("Удалено");
      router.refresh();
    } catch {
      toast.error("Ошибка сети");
    }
  }

  function openAddItem() {
    setEditItem(null);
    setItemOpen(true);
  }

  function openEditItem(item: PriceCatalogItem) {
    setEditItem(item);
    setItemOpen(true);
  }

  function openAddMult() {
    setEditMult(null);
    setMultOpen(true);
  }

  function openEditMult(mult: PriceMultiplier) {
    setEditMult(mult);
    setMultOpen(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Каталог цен</h1>
        <p className="text-muted-foreground">
          Операции, расценки и множители
        </p>
      </div>

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Каталог ({items.length})</TabsTrigger>
          <TabsTrigger value="multipliers">
            Множители ({multipliers.length})
          </TabsTrigger>
        </TabsList>

        {/* Catalog tab */}
        <TabsContent value="catalog" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить операцию
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Каталог пуст. Добавьте первую операцию.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Операция</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead className="text-right">Цена</TableHead>
                    <TableHead>Ед.</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.operation_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORY_LABELS[item.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.base_price)}
                      </TableCell>
                      <TableCell>{UNIT_LABELS[item.unit]}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditItem(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Multipliers tab */}
        <TabsContent value="multipliers" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAddMult}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить множитель
            </Button>
          </div>

          {multipliers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Множителей нет. Добавьте первый множитель.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead className="text-right">Значение</TableHead>
                    <TableHead>Применяется к</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {multipliers.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        ×{m.value}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {APPLIES_TO_LABELS[m.applies_to]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditMult(m)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMultiplier(m.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ItemDialog
        open={itemOpen}
        onOpenChange={setItemOpen}
        item={editItem}
      />
      <MultiplierDialog
        open={multOpen}
        onOpenChange={setMultOpen}
        multiplier={editMult}
      />
    </div>
  );
}
