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
//  License server module — OFFLINE validation of signed keys.
//  Keys carry an Ed25519 signature; verification needs no vendor server
//  and works fully inside the customer's own deployment.
//  Server-only (node:crypto). Do not import from client components.
// ============================================================================

import { createPublicKey, verify as edVerify } from "crypto";
import { getDb, newId } from "./db";
import { LICENSE_PUBLIC_KEY } from "./license-public-key";
import { getPlanConfig } from "./plans";
import type { License, Plan } from "./types";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PAYLOAD_LEN = 3;
const SIG_LEN = 64;
const DAY_MS = 86400000;
const EPOCH = Date.UTC(2026, 0, 1);

// ---- Base32 (RFC 4648, no padding) — decode only ----
function base32Decode(input: string): Uint8Array | null {
  const clean = input.replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z2-7]+$/.test(clean)) return null;
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// ---- Signature verification ----
export interface VerifiedKey {
  plan: Plan;
  expiresAt: string | null;
}

export function verifyLicenseKey(rawKey: string): VerifiedKey | { error: string } {
  const decoded = base32Decode(rawKey);
  if (!decoded || decoded.length !== 1 + PAYLOAD_LEN + SIG_LEN) {
    return { error: "Неверный формат лицензионного ключа" };
  }

  if (decoded[0] !== PAYLOAD_LEN) {
    return { error: "Неверный формат лицензионного ключа" };
  }

  // Payload: [planByte, daysHi, daysLo] — signed as-is
  const payload = decoded.slice(1, 1 + PAYLOAD_LEN);
  const sig = decoded.slice(1 + PAYLOAD_LEN, 1 + PAYLOAD_LEN + SIG_LEN);

  const publicKey = createPublicKey(LICENSE_PUBLIC_KEY);
  const sigOk = edVerify(
    null,
    Buffer.from(payload),
    publicKey,
    Buffer.from(sig)
  );
  if (!sigOk) {
    return { error: "Подпись ключа не прошла проверку" };
  }

  const planByte = payload[0];
  const plan: Plan = planByte === 1 ? "pro" : planByte === 2 ? "enterprise" : "free";
  if (plan === "free") {
    return { error: "Ключ не содержит платного тарифа" };
  }

  const days = (payload[1] << 8) | payload[2];
  let expiresAt: string | null = null;
  if (days > 0) {
    const expiryMs = EPOCH + days * DAY_MS + DAY_MS - 1; // end of day
    if (expiryMs < Date.now()) {
      return { error: "Срок действия ключа истёк" };
    }
    expiresAt = new Date(expiryMs).toISOString();
  }

  return { plan, expiresAt };
}

// ---- Activate / bind key to workspace (local DB) ----
export async function activateLicense(
  key: string,
  workspaceId: string,
  hardwareId: string
): Promise<{ success: boolean; license?: License; error?: string }> {
  const verified = verifyLicenseKey(key);
  if ("error" in verified) {
    return { success: false, error: verified.error };
  }

  const db = getDb();
  const normalizedKey = key.trim().toUpperCase().replace(/[\s-]/g, "");

  const existing = db
    .prepare("SELECT * FROM licenses WHERE key = ?")
    .get(normalizedKey) as { workspace_id?: string } | undefined;

  if (existing?.workspace_id && existing.workspace_id !== workspaceId) {
    return { success: false, error: "Ключ уже привязан к другому workspace" };
  }

  const licenseId = newId();
  const activatedAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO licenses (id, workspace_id, key, plan, activated_at, expires_at, hardware_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
     ON CONFLICT(key) DO UPDATE SET
       workspace_id = excluded.workspace_id,
       plan = excluded.plan,
       activated_at = excluded.activated_at,
       expires_at = excluded.expires_at,
       hardware_id = excluded.hardware_id,
       status = 'active'`
  ).run(licenseId, workspaceId, normalizedKey, verified.plan, activatedAt, verified.expiresAt, hardwareId || null);

  const planConfig = getPlanConfig(verified.plan);
  db.prepare(
    `UPDATE workspaces SET plan = ?, max_users = ?, max_projects = ?, license_key = ?, expires_at = ?
     WHERE id = ?`
  ).run(
    verified.plan,
    planConfig.maxUsers,
    planConfig.maxProjects,
    normalizedKey,
    verified.expiresAt,
    workspaceId
  );

  db.prepare(
    `INSERT INTO audit_log (id, workspace_id, user_id, action, entity_type, entity_id, metadata)
     VALUES (?, ?, NULL, 'license.activated', 'license', ?, ?)`
  ).run(newId(), workspaceId, normalizedKey, JSON.stringify({ plan: verified.plan }));

  const license = db
    .prepare("SELECT * FROM licenses WHERE key = ?")
    .get(normalizedKey) as unknown as License;

  return { success: true, license };
}

// ---- Runtime validation (local DB) ----
export async function validateLicense(
  workspaceId: string,
  hardwareId: string
): Promise<{ valid: boolean; plan: Plan; reason?: string }> {
  const db = getDb();
  const license = db
    .prepare("SELECT * FROM licenses WHERE workspace_id = ?")
    .get(workspaceId) as
    | { status: string; expires_at: string | null; hardware_id: string | null; plan: Plan }
    | undefined;

  if (!license) {
    return { valid: false, plan: "free", reason: "Лицензия не найдена" };
  }

  if (license.status === "revoked") {
    return { valid: false, plan: "free", reason: "Лицензия отозвана" };
  }

  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    return { valid: false, plan: "free", reason: "Срок действия истёк" };
  }

  if (license.hardware_id && hardwareId && license.hardware_id !== hardwareId) {
    return { valid: false, plan: "free", reason: "Несовпадение hardware_id" };
  }

  return { valid: true, plan: license.plan };
}
