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
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FEATURE_LABELS, type PlanFeature } from "@/lib/plans";

export function PlanPaywall({ feature }: { feature: PlanFeature }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          «{FEATURE_LABELS[feature]}» доступно на тарифах Pro и Enterprise
        </h2>
        <p className="text-sm text-muted-foreground">
          Обновите тариф, чтобы открыть этот раздел.
        </p>
      </div>
      <Button asChild>
        <Link href="/pricing">
          <Sparkles className="mr-2 h-4 w-4" />
          Смотреть тарифы
        </Link>
      </Button>
      <a
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        href="mailto:djonros@gmail.com?subject=%D0%9B%D0%B8%D1%86%D0%B5%D0%BD%D0%B7%D0%B8%D1%8F%20EngDept%20SaaS"
      >
        Написать поставщику
      </a>
    </div>
  );
}
