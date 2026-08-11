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

import Image from "next/image";
import {
  type CompanyDetails,
  type Project,
  STAGE_LABELS,
  type TaskWithRelations,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface PaymentDocumentProps {
  project: Project;
  tasks: TaskWithRelations[];
  companyName: string;
  logoUrl: string | null;
  companyDetails: CompanyDetails;
}

interface PerformerTotals {
  name: string;
  email: string;
  taskCount: number;
  total: number;
}

export function PaymentDocument({
  project,
  tasks,
  companyName,
  logoUrl,
  companyDetails,
}: PaymentDocumentProps) {
  const today = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const docNumber = `№ ${project.id.slice(0, 8).toUpperCase()}`;

  // Calculate totals
  const grandTotal = tasks.reduce((sum, t) => sum + Number(t.cost ?? 0), 0);

  // Group by performer
  const byPerformer = new Map<string, PerformerTotals>();
  for (const task of tasks) {
    const key = task.assignee_id ?? "unassigned";
    const name = task.assignee?.name ?? "Не назначен";
    const email = (task.assignee as { email?: string } | null)?.email ?? "";
    const existing = byPerformer.get(key);
    const cost = Number(task.cost ?? 0);
    if (existing) {
      existing.taskCount++;
      existing.total += cost;
    } else {
      byPerformer.set(key, { name, email, taskCount: 1, total: cost });
    }
  }

  const performers = Array.from(byPerformer.values()).sort(
    (a, b) => b.total - a.total
  );

  const cd = companyDetails;

  return (
    <div className="min-h-screen bg-white text-black print:min-h-0">
      {/* Toolbar */}
      <div className="border-b bg-muted print:hidden">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between px-6 py-3">
          <button
            onClick={() => window.print()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Печать / Сохранить в PDF
          </button>
          <a
            href={`/projects/${project.id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Назад к проекту
          </a>
        </div>
      </div>

      {/* Document */}
      <div className="mx-auto max-w-[210mm] px-6 py-8 print:px-0 print:py-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <Image
                src={logoUrl}
                alt="Логотип"
                width={56}
                height={56}
                className="h-14 w-14 rounded border object-cover"
              />
            )}
            <div>
              <div className="text-lg font-bold">
                {cd.name || companyName}
              </div>
              {cd.address && (
                <div className="text-xs text-gray-600">{cd.address}</div>
              )}
              <div className="flex gap-3 text-xs text-gray-600">
                {cd.inn && <span>ИНН: {cd.inn}</span>}
                {cd.kpp && <span>КПП: {cd.kpp}</span>}
                {cd.ogrn && <span>ОГРН: {cd.ogrn}</span>}
              </div>
              <div className="flex gap-3 text-xs text-gray-600">
                {cd.phone && <span>Тел: {cd.phone}</span>}
                {cd.email && <span>{cd.email}</span>}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {today}
            </div>
            <div className="mt-1 text-sm font-semibold">
              Документ на оплату
            </div>
            <div className="text-xs text-gray-500">{docNumber}</div>
          </div>
        </div>

        <hr className="my-4 border-gray-300" />

        {/* Project info */}
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold">{project.title}</h1>
          {project.description && (
            <p className="text-sm text-gray-700">{project.description}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              Задач: <strong>{tasks.length}</strong>
            </span>
            <span>
              Завершено:{" "}
              <strong>
                {tasks.filter((t) => t.stage === "done").length}
              </strong>
            </span>
            {project.target_date && (
              <span>
                Срок проекта: <strong>{project.target_date}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Task table */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-gray-400 bg-gray-100 text-left">
              <th className="border border-gray-300 px-2 py-1.5 text-center">
                №
              </th>
              <th className="border border-gray-300 px-2 py-1.5">
                Наименование работы
              </th>
              <th className="border border-gray-300 px-2 py-1.5">
                Этап
              </th>
              <th className="border border-gray-300 px-2 py-1.5">
                Исполнитель
              </th>
              <th className="border border-gray-300 px-2 py-1.5 text-right">
                Стоимость, ₽
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-2 py-1.5 text-center">
                  {i + 1}
                </td>
                <td className="border border-gray-300 px-2 py-1.5">
                  {task.title}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-gray-700">
                  {STAGE_LABELS[task.stage]}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-gray-700">
                  {task.assignee?.name ?? "—"}
                </td>
                <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                  {Number(task.cost ?? 0).toLocaleString("ru-RU")}
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="border border-gray-300 px-2 py-4 text-center text-gray-500"
                >
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-500 bg-gray-100 font-bold">
              <td colSpan={4} className="border border-gray-300 px-2 py-2 text-right">
                ИТОГО:
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right tabular-nums">
                {formatCurrency(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* By performer */}
        {performers.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-700">
              Расчёт по исполнителям
            </h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-y border-gray-400 bg-gray-100 text-left">
                  <th className="border border-gray-300 px-2 py-1.5">
                    Исполнитель
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-center">
                    Кол-во задач
                  </th>
                  <th className="border border-gray-300 px-2 py-1.5 text-right">
                    Сумма, ₽
                  </th>
                </tr>
              </thead>
              <tbody>
                {performers.map((p) => (
                  <tr key={p.email || p.name}>
                    <td className="border border-gray-300 px-2 py-1.5">
                      {p.name}
                      {p.email && (
                        <span className="ml-1 text-xs text-gray-500">
                          ({p.email})
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">
                      {p.taskCount}
                    </td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right tabular-nums">
                      {p.total.toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-500 bg-gray-100 font-bold">
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    ИТОГО:
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {performers.reduce((s, p) => s + p.taskCount, 0)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right tabular-nums">
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Bank details */}
        {(cd.account || cd.bank || cd.bik) && (
          <div className="mt-8 border border-gray-300 p-3 text-xs text-gray-700">
            <div className="mb-1 font-bold uppercase tracking-wide">
              Банковские реквизиты
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
              {cd.account && (
                <div>
                  <span className="text-gray-500">Р/с:</span> {cd.account}
                </div>
              )}
              {cd.bank && (
                <div>
                  <span className="text-gray-500">Банк:</span> {cd.bank}
                </div>
              )}
              {cd.bik && (
                <div>
                  <span className="text-gray-500">БИК:</span> {cd.bik}
                </div>
              )}
              {cd.corr_account && (
                <div>
                  <span className="text-gray-500">К/с:</span> {cd.corr_account}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
          <div>
            <div className="mb-8 text-gray-700">
              {cd.ceo_name || "Руководитель"}
            </div>
            <div className="border-t border-gray-500 pt-1 text-xs text-gray-600">
              Подпись / ФИО
            </div>
          </div>
          <div>
            <div className="mb-8 text-gray-700">&nbsp;</div>
            <div className="border-t border-gray-500 pt-1 text-xs text-gray-600">
              М.П.
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          © 2024–2026 Djonros (djonros@gmail.com)
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
