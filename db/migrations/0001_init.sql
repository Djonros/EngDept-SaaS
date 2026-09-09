-- ============================================================================
--  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
--  All rights reserved.
--
--  This software and its source code are the proprietary property of Djonros.
--  Unauthorized copying, modification, merging, publication, distribution,
--  sublicensing, and/or selling of this software, via any medium, is strictly
--  prohibited without prior written permission from the copyright holder.
--
--  Licensed under the Proprietary License.
--  You may not use this file except in compliance with the License.
--  You may obtain a copy of the License by contacting: djonros@gmail.com
--
--  Violators will be prosecuted to the maximum extent possible under the law.
-- ============================================================================

-- ============================================================================
--  ENG-DEPT SaaS — SQLite init (self-contained, no Supabase)
--  Unified schema from former Supabase migrations 0001–0009:
--  tables, CHECK constraints, triggers (updated_at, plan limits).
--  Data isolation is enforced in the application layer (lib/repo.ts).
-- ============================================================================

-- 1. workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    plan            TEXT NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free','pro','enterprise')),
    license_key     TEXT UNIQUE,
    max_users       INTEGER NOT NULL DEFAULT 3,
    max_projects    INTEGER DEFAULT 3,
    company_details TEXT NOT NULL DEFAULT '{}',
    logo_url        TEXT,
    expires_at      TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 2. users (+ own auth: password_hash; roles stored as JSON array)
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'engineer'
                  CHECK (role IN ('owner','manager','engineer','freelancer','reviewer')),
    roles         TEXT NOT NULL DEFAULT '[]',
    telegram_id   TEXT,
    avatar_url    TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. sessions (own auth)
CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 4. projects
CREATE TABLE IF NOT EXISTS projects (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    description  TEXT,
    budget       REAL DEFAULT 0,
    target_date  TEXT,
    status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','on_hold','completed','cancelled')),
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);

-- 5. milestones
CREATE TABLE IF NOT EXISTS milestones (
    id          TEXT PRIMARY KEY,
    project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);

-- 6. tasks
CREATE TABLE IF NOT EXISTS tasks (
    id               TEXT PRIMARY KEY,
    workspace_id     TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id     TEXT REFERENCES milestones(id) ON DELETE SET NULL,
    assignee_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
    reviewer_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
    stage            TEXT NOT NULL DEFAULT 'brief'
                     CHECK (stage IN ('brief','concept','3d','2d','calc','review','done')),
    title            TEXT NOT NULL,
    description      TEXT,
    yandex_disk_link TEXT,
    cost             REAL DEFAULT 0,
    rework_count     INTEGER NOT NULL DEFAULT 0,
    due_date         TEXT,
    completed_at     TEXT,
    paid_at          TEXT,
    created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage ON tasks(stage);

-- 7. stp_checklists (items stored as JSON text)
CREATE TABLE IF NOT EXISTS stp_checklists (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    stage        TEXT NOT NULL
                 CHECK (stage IN ('brief','concept','3d','2d','calc','review','done')),
    items        TEXT NOT NULL DEFAULT '[]',
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE (workspace_id, stage)
);
CREATE INDEX IF NOT EXISTS idx_stp_workspace ON stp_checklists(workspace_id);

-- 8. price_catalog
CREATE TABLE IF NOT EXISTS price_catalog (
    id             TEXT PRIMARY KEY,
    workspace_id   TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    operation_name TEXT NOT NULL,
    category       TEXT NOT NULL DEFAULT 'general'
                   CHECK (category IN ('general','3d','2d','calc','documentation','other')),
    base_price     REAL NOT NULL DEFAULT 0,
    unit           TEXT NOT NULL DEFAULT 'pc'
                   CHECK (unit IN ('pc','hour','sheet','assembly','drawing')),
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_price_catalog_workspace ON price_catalog(workspace_id);

-- 9. price_multipliers
CREATE TABLE IF NOT EXISTS price_multipliers (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    value        REAL NOT NULL DEFAULT 1.0,
    applies_to   TEXT NOT NULL DEFAULT 'all'
                 CHECK (applies_to IN ('all','3d','2d','calc','documentation')),
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_price_mult_workspace ON price_multipliers(workspace_id);

-- 10. licenses (offline Ed25519 keys, one per workspace)
CREATE TABLE IF NOT EXISTS licenses (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
    key          TEXT NOT NULL UNIQUE,
    plan         TEXT NOT NULL DEFAULT 'pro'
                 CHECK (plan IN ('free','pro','enterprise')),
    activated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    expires_at   TEXT,
    hardware_id  TEXT,
    status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','expired','revoked')),
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_licenses_workspace ON licenses(workspace_id);

-- 11. audit_log (metadata stored as JSON text)
CREATE TABLE IF NOT EXISTS audit_log (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
    action       TEXT NOT NULL,
    entity_type  TEXT,
    entity_id    TEXT,
    metadata     TEXT DEFAULT '{}',
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_workspace ON audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_log(created_at DESC);

-- 12. project_members
CREATE TABLE IF NOT EXISTS project_members (
    id         TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL DEFAULT 'engineer'
               CHECK (role IN ('lead','engineer','reviewer','observer')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- ============================================================================
--  Triggers
-- ============================================================================

-- updated_at for projects / tasks
CREATE TRIGGER IF NOT EXISTS trg_projects_updated
AFTER UPDATE ON projects
BEGIN
  UPDATE projects SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_tasks_updated
AFTER UPDATE ON tasks
BEGIN
  UPDATE tasks SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  WHERE id = NEW.id;
END;

-- Freemium limit: max projects per workspace (workspaces.max_projects, NULL = unlimited)
CREATE TRIGGER IF NOT EXISTS trg_projects_limit
BEFORE INSERT ON projects
WHEN (SELECT max_projects FROM workspaces WHERE id = NEW.workspace_id) IS NOT NULL
BEGIN
  SELECT RAISE(ABORT, 'Достигнут лимит проектов тарифа — обновите тариф')
  WHERE (SELECT COUNT(*) FROM projects WHERE workspace_id = NEW.workspace_id)
        >= (SELECT max_projects FROM workspaces WHERE id = NEW.workspace_id);
END;

-- Freemium limit: max users per workspace (workspaces.max_users)
CREATE TRIGGER IF NOT EXISTS trg_users_limit_insert
BEFORE INSERT ON users
BEGIN
  SELECT RAISE(ABORT, 'Достигнут лимит пользователей тарифа — обновите тариф')
  WHERE (SELECT COUNT(*) FROM users WHERE workspace_id = NEW.workspace_id)
        >= (SELECT max_users FROM workspaces WHERE id = NEW.workspace_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_users_limit_update
BEFORE UPDATE OF workspace_id ON users
WHEN NEW.workspace_id != OLD.workspace_id
BEGIN
  SELECT RAISE(ABORT, 'Достигнут лимит пользователей тарифа — обновите тариф')
  WHERE (SELECT COUNT(*) FROM users WHERE workspace_id = NEW.workspace_id)
        >= (SELECT max_users FROM workspaces WHERE id = NEW.workspace_id);
END;
