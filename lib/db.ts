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
//  SQLite database — singleton with auto-migrations.
//  File lives in DATA_DIR (default: ./data/app.db) next to the deployment.
//  Server-only. Do not import from client components.
// ============================================================================

import Database from "better-sqlite3";
import { readFileSync, readdirSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

declare global {
  // eslint-disable-next-line no-var
  var __engdeptDb: Database.Database | undefined;
}

// Base dir = process.cwd() (project root in dev, app root in standalone)
function baseDir(): string {
  return process.cwd();
}

function dataDir(): string {
  const env = process.env.DATA_DIR;
  if (env && env.trim()) return resolve(env);
  // data/ next to the deployment; fall back to <root>/../data for standalone layouts
  const candidates = [
    join(baseDir(), "data"),
    join(baseDir(), "..", "data"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0];
}

function migrationsDir(): string {
  const env = process.env.MIGRATIONS_DIR;
  if (env && env.trim()) return resolve(env);
  const candidates = [
    join(baseDir(), "db", "migrations"),
    join(baseDir(), "..", "db", "migrations"),
  ];
  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }
  return candidates[0];
}

function openDatabase(): Database.Database {
  const dir = dataDir();
  mkdirSync(dir, { recursive: true });
  const db = new Database(join(dir, "app.db"));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name TEXT PRIMARY KEY,
       applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
     )`
  );

  const dir = migrationsDir();
  if (!existsSync(dir)) return;

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    (db.prepare("SELECT name FROM _migrations").all() as { name: string }[]).map(
      (r) => r.name
    )
  );

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(dir, file), "utf8");
    const run = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
    });
    run();
  }
}

export function getDb(): Database.Database {
  if (!global.__engdeptDb) {
    global.__engdeptDb = openDatabase();
  }
  return global.__engdeptDb;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
