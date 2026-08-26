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
//  Plans config — single source of truth for freemium limits and features
// ============================================================================

import type { Plan } from "./types";

export type PlanFeature = "analytics" | "catalog" | "payment-doc" | "branding";

export interface PlanConfig {
  maxUsers: number;
  maxProjects: number | null;
  durationDays: number | null;
  priceRub: number;
  features: PlanFeature[];
}

export const PLAN_LABELS: Record<Plan, string> = {
  free: "Бесплатный",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const PLAN_ORDER: Plan[] = ["free", "pro", "enterprise"];

export const FEATURE_LABELS: Record<PlanFeature, string> = {
  analytics: "Аналитика и отчёты",
  catalog: "Каталог цен",
  "payment-doc": "Платёжные документы",
  branding: "Брендинг (логотип и реквизиты)",
};

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  free: {
    maxUsers: 3,
    maxProjects: 3,
    durationDays: null,
    priceRub: 0,
    features: [],
  },
  pro: {
    maxUsers: 25,
    maxProjects: null,
    durationDays: 365,
    priceRub: 2990,
    features: ["analytics", "catalog", "payment-doc"],
  },
  enterprise: {
    maxUsers: 100,
    maxProjects: null,
    durationDays: 365,
    priceRub: 7990,
    features: ["analytics", "catalog", "payment-doc", "branding"],
  },
};

export function getPlanConfig(plan: Plan): PlanConfig {
  return PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
}

export function hasFeature(plan: Plan, feature: PlanFeature): boolean {
  return getPlanConfig(plan).features.includes(feature);
}

export function isFreePlan(plan: Plan): boolean {
  return plan === "free";
}

export function formatRub(value: number): string {
  return value.toLocaleString("ru-RU") + " ₽";
}
