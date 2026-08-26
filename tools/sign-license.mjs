// ============================================================================
//  License key signer — vendor-side tool (NOT shipped to customers).
//  Signs plan + expiry with Ed25519; the app verifies offline with the
//  embedded public key (lib/license-public-key.ts).
//
//  Usage:
//    node tools/sign-license.mjs --init        create license-private.pem (once)
//    node tools/sign-license.mjs pro 12        pro key, 12 months
//    node tools/sign-license.mjs enterprise    enterprise key, lifetime
// ============================================================================

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { generateKeyPairSync, sign as edSign } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRIV_PATH = join(ROOT, "license-private.pem");

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DAY_MS = 86400000;
const EPOCH = Date.UTC(2026, 0, 1);

function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function groupKey(s) {
  return s.replace(/(.{5})/g, "$1-").replace(/-$/, "");
}

const [,, argPlan, argMonths] = process.argv;

if (argPlan === "--init") {
  if (existsSync(PRIV_PATH)) {
    console.log("license-private.pem already exists — keeping it.");
  } else {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    writeFileSync(PRIV_PATH, privateKey.export({ type: "pkcs8", format: "pem" }));
    console.log("Created license-private.pem\n");
    console.log("PUBLIC KEY — paste into lib/license-public-key.ts:");
    console.log(publicKey.export({ type: "spki", format: "pem" }));
  }
  process.exit(0);
}

const plan = String(argPlan || "").toLowerCase();
if (plan !== "pro" && plan !== "enterprise") {
  console.error("Plan must be: pro | enterprise");
  process.exit(1);
}

// Compact payload: [planByte, expiryDaysHi, expiryDaysLo] (3 bytes)
// planByte: 1 = pro, 2 = enterprise; days: uint16 since 2026-01-01, 0 = lifetime
const planByte = plan === "pro" ? 1 : 2;
let days = 0;
let expiresLabel = "lifetime";
const months = Number(argMonths);
if (Number.isFinite(months) && months > 0) {
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  days = Math.max(1, Math.floor((Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate()) - EPOCH) / DAY_MS));
  expiresLabel = new Date(EPOCH + days * DAY_MS).toISOString().slice(0, 10);
}

const payloadBytes = Buffer.from([planByte, (days >> 8) & 255, days & 255]);
const privateKey = readFileSync(PRIV_PATH, "utf8");
const sig = edSign(null, payloadBytes, privateKey);

const buffer = Buffer.concat([Buffer.from([payloadBytes.length]), payloadBytes, sig]);
const key = groupKey(base32Encode(new Uint8Array(buffer)));

console.log(`Plan:    ${plan}`);
console.log(`Valid:   ${expiresLabel}`);
console.log(`KEY:`);
console.log(key);
