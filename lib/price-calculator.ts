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
//  Price Calculator
//  Computes task cost: base_price × applicable multipliers × quantity
// ============================================================================

import type { PriceMultiplier, TaskStage } from "./types";

export interface PriceBreakdown {
  basePrice: number;
  multiplierTotal: number;
  finalPrice: number;
  breakdown: Array<{
    label: string;
    type: "base" | "multiplier";
    amount: number;
  }>;
}

// ---- Core calculation ----
export function calculatePrice(params: {
  basePrice: number;
  quantity: number;
  multipliers: PriceMultiplier[];
  stage: TaskStage;
  operationName: string;
}): PriceBreakdown {
  const { basePrice, quantity, multipliers, stage } = params;

  const breakdown: PriceBreakdown["breakdown"] = [];
  breakdown.push({
    label: `Базовая цена × ${quantity}`,
    type: "base",
    amount: basePrice * quantity,
  });

  // Filter multipliers: applies_to = 'all' or matching stage
  const stageStr = stage as string;
  const applicable = multipliers.filter(
    (m) => m.applies_to === "all" || m.applies_to === stageStr
  );

  let running = basePrice * quantity;

  for (const m of applicable) {
    const delta = running * (Number(m.value) - 1);
    running += delta;
    breakdown.push({
      label: `${m.name} (×${m.value})`,
      type: "multiplier",
      amount: delta,
    });
  }

  const multiplierTotal = running - basePrice * quantity;

  return {
    basePrice: basePrice * quantity,
    multiplierTotal,
    finalPrice: Math.round(running * 100) / 100,
    breakdown,
  };
}

// ---- Project budget total ----
export function calculateProjectBudget(
  tasks: Array<{ cost: number | null }>,
  baseBudget: number = 0
): number {
  const taskTotal = tasks.reduce(
    (sum, t) => sum + (t.cost ? Number(t.cost) : 0),
    0
  );
  return Math.round((baseBudget + taskTotal) * 100) / 100;
}
