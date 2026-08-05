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
//  License Validator
//  Generates, validates, and binds licenses to a workspace + hardware_id.
// ============================================================================

import { createAdminClient } from "./supabase-client";
import type { License, Plan } from "./types";

const ENCRYPTION_KEY = process.env.LICENSE_ENCRYPTION_KEY ?? "default-dev-key-change-me-32!";

const PLANS: Record<Plan, { maxUsers: number; durationDays: number | null }> = {
  free: { maxUsers: 5, durationDays: null },
  pro: { maxUsers: 25, durationDays: 365 },
  enterprise: { maxUsers: 100, durationDays: 365 },
};

// ---- Key generation (XXXX-XXXX-XXXX-XXXX) ----
export function generateLicenseKey(): string {
  const segments: string[] = [];
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let s = 0; s < 4; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return segments.join("-");
}

// ---- Fingerprint hash ----
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---- Activate / bind license to workspace ----
export async function activateLicense(
  key: string,
  workspaceId: string,
  hardwareId: string
): Promise<{ success: boolean; license?: License; error?: string }> {
  const supabase = createAdminClient();

  const { data: existing, error: fetchErr } = await supabase
    .from("licenses")
    .select("*")
    .eq("key", key.toUpperCase().trim())
    .single();

  if (fetchErr || !existing) {
    return { success: false, error: "Лицензионный ключ не найден" };
  }

  if (existing.status === "revoked") {
    return { success: false, error: "Лицензия отозвана" };
  }

  // If already bound to a different workspace → reject
  if (existing.workspace_id && existing.workspace_id !== workspaceId) {
    return { success: false, error: "Ключ уже привязан к другому workspace" };
  }

  const plan = existing.plan as Plan;
  const durationDays = PLANS[plan].durationDays;
  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 86400000).toISOString()
    : null;

  const { data: updated, error: updateErr } = await supabase
    .from("licenses")
    .update({
      workspace_id: workspaceId,
      hardware_id: hardwareId,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: "active",
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (updateErr || !updated) {
    return { success: false, error: "Не удалось активировать лицензию" };
  }

  // Sync workspace plan + max_users
  await supabase
    .from("workspaces")
    .update({
      plan: plan,
      max_users: PLANS[plan].maxUsers,
      license_key: key.toUpperCase().trim(),
      expires_at: expiresAt,
    })
    .eq("id", workspaceId);

  return { success: true, license: updated as License };
}

// ---- Validate at runtime ----
export async function validateLicense(
  workspaceId: string,
  hardwareId: string
): Promise<{ valid: boolean; plan: Plan; reason?: string }> {
  const supabase = createAdminClient();

  const { data: license } = await supabase
    .from("licenses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();

  if (!license) {
    return { valid: false, plan: "free", reason: "Лицензия не найдена" };
  }

  if (license.status === "revoked") {
    return { valid: false, plan: "free", reason: "Лицензия отозвана" };
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return { valid: false, plan: "free", reason: "Срок действия истёк" };
  }

  // Verify hardware binding (optional — skip if hardware_id is null)
  if (license.hardware_id && license.hardware_id !== hardwareId) {
    return { valid: false, plan: "free", reason: "Несовпадение hardware_id" };
  }

  return { valid: true, plan: license.plan as Plan };
}

// ---- Get hardware fingerprint (client-side) ----
export async function getHardwareFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset().toString(),
    (navigator.hardwareConcurrency || 0).toString(),
  ].join("|");

  return sha256(ENCRYPTION_KEY + components);
}
