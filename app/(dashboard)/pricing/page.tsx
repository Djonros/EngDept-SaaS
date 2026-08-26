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

import Link from "next/link";
import { Check, X, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PLAN_CONFIG,
  PLAN_LABELS,
  PLAN_ORDER,
  FEATURE_LABELS,
  formatRub,
  type PlanFeature,
} from "@/lib/plans";
import type { Plan } from "@/lib/types";

const ALL_FEATURES: PlanFeature[] = ["analytics", "catalog", "payment-doc", "branding"];

export default async function PricingPage() {
  const session = await requireSession();
  const currentPlan = session.workspace.plan;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Тарифы</h1>
        <p className="text-sm text-muted-foreground">
          Выберите тариф под размер вашей команды. Оплата — по лицензионному
          ключу на 12 месяцев.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((plan: Plan) => {
          const config = PLAN_CONFIG[plan];
          const isCurrent = plan === currentPlan;
          const highlight = plan === "pro";
          return (
            <Card
              key={plan}
              className={cn(
                "relative flex flex-col",
                isCurrent && "border-primary",
                highlight && !isCurrent && "border-primary/50"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{PLAN_LABELS[plan]}</CardTitle>
                  {isCurrent && <Badge>Текущий тариф</Badge>}
                </div>
                <div className="pt-2">
                  <span className="text-3xl font-bold">
                    {formatRub(config.priceRub)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {config.priceRub === 0 ? " — навсегда" : " / мес"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-600" />
                    До {config.maxUsers} пользователей
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-green-600" />
                    {config.maxProjects == null
                      ? "Неограниченное число проектов"
                      : `До ${config.maxProjects} проектов`}
                  </li>
                  {ALL_FEATURES.map((feature) => {
                    const included = config.features.includes(feature);
                    return (
                      <li
                        key={feature}
                        className={cn(
                          "flex items-center gap-2",
                          !included && "text-muted-foreground"
                        )}
                      >
                        {included ? (
                          <Check className="h-4 w-4 shrink-0 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 shrink-0" />
                        )}
                        {FEATURE_LABELS[feature]}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-auto">
                  {plan === "free" ? (
                    <Button variant="outline" className="w-full" disabled>
                      Начальный уровень
                    </Button>
                  ) : isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Активирован
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/admin?tab=license">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Активировать ключ
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Как оплатить</p>
          Напишите поставщику —{" "}
          <a
            className="font-medium text-primary underline underline-offset-4"
            href="mailto:djonros@gmail.com?subject=%D0%9B%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F%20EngDept%20SaaS"
          >
            djonros@gmail.com
          </a>{" "}
          — для покупки лицензионного ключа Pro или Enterprise, затем
          активируйте ключ в разделе «Администрирование → Лицензия». Ключ
          действует 12 месяцев.
        </CardContent>
      </Card>
    </div>
  );
}
