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

import { requireSession } from "@/lib/session";
import { createServerClient } from "@/lib/supabase-server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";
import { Wallet, Clock, CheckCircle2 } from "lucide-react";

export default async function MyWalletPage() {
  const session = await requireSession();
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      `*,
      project:projects(id, title)`
    )
    .eq("workspace_id", wid)
    .eq("assignee_id", session.user.id)
    .eq("stage", "done")
    .order("completed_at", { ascending: false });

  const doneTasks = (tasks ?? []) as unknown as TaskWithRelations[];

  const totalEarned = doneTasks.reduce(
    (sum, t) => sum + (Number(t.cost) || 0),
    0
  );
  const pendingAmount = doneTasks
    .filter((t) => !t.paid_at)
    .reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
  const paidAmount = doneTasks
    .filter((t) => t.paid_at)
    .reduce((sum, t) => sum + (Number(t.cost) || 0), 0);

  const SUMMARY_CARDS = [
    {
      label: "Заработано всего",
      value: formatCurrency(totalEarned),
      icon: Wallet,
    },
    {
      label: "Ожидает выплаты",
      value: formatCurrency(pendingAmount),
      icon: Clock,
    },
    {
      label: "Выплачено",
      value: formatCurrency(paidAmount),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Мой кошелёк</h1>
        <p className="text-muted-foreground">
          Заработок по выполненным задачам
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {SUMMARY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            История выплат ({doneTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doneTasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Завершённых задач пока нет
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Задача</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Завершено</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doneTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.project?.title ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(task.completed_at)}
                    </TableCell>
                    <TableCell>
                      {task.paid_at ? (
                        <Badge variant="success">Выплачено</Badge>
                      ) : (
                        <Badge variant="warning">Ожидает</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(task.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
