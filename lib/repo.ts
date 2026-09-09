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
//  Data access layer (SQLite).
//  SECURITY: replaces Postgres RLS — every read/write MUST be scoped by
//  workspace_id (directly or via join). Server-only.
// ============================================================================

import { getDb, newId } from "./db";
import type {
  AuditLogEntry,
  CompanyDetails,
  Milestone,
  PriceCatalogItem,
  PriceMultiplier,
  Project,
  ProjectMember,
  ProjectMemberWithUser,
  ProjectStatus,
  StpChecklistItem,
  Task,
  TaskStage,
  TaskWithRelations,
  User,
  UserRole,
  Workspace,
} from "./types";

type Row = Record<string, unknown>;

// ---- Row mappers ----
function toUser(r: Row): User {
  return {
    id: r.id as string,
    workspace_id: r.workspace_id as string,
    name: r.name as string,
    email: r.email as string,
    role: r.role as UserRole,
    roles: JSON.parse((r.roles as string) ?? "[]") as UserRole[],
    telegram_id: (r.telegram_id as string | null) ?? null,
    avatar_url: (r.avatar_url as string | null) ?? null,
    is_active: r.is_active === 1,
    created_at: r.created_at as string,
  };
}

function toProject(r: Row): Project {
  return {
    id: r.id as string,
    workspace_id: r.workspace_id as string,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    budget: (r.budget as number | null) ?? null,
    target_date: (r.target_date as string | null) ?? null,
    status: r.status as ProjectStatus,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
}

const TASK_JOIN_SQL = `
  SELECT t.*,
    au.id   AS a_id,   au.name AS a_name,   au.avatar_url AS a_avatar,
    ru.id   AS r_id,   ru.name AS r_name,   ru.avatar_url AS r_avatar,
    p.id    AS p_id,   p.title AS p_title,
    m.id    AS m_id,   m.title AS m_title
  FROM tasks t
  LEFT JOIN users au ON au.id = t.assignee_id
  LEFT JOIN users ru ON ru.id = t.reviewer_id
  LEFT JOIN projects p ON p.id = t.project_id
  LEFT JOIN milestones m ON m.id = t.milestone_id
`;

function toTask(r: Row): TaskWithRelations {
  const task: TaskWithRelations = {
    id: r.id as string,
    workspace_id: r.workspace_id as string,
    project_id: r.project_id as string,
    milestone_id: (r.milestone_id as string | null) ?? null,
    assignee_id: (r.assignee_id as string | null) ?? null,
    reviewer_id: (r.reviewer_id as string | null) ?? null,
    stage: r.stage as TaskStage,
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    yandex_disk_link: (r.yandex_disk_link as string | null) ?? null,
    cost: (r.cost as number | null) ?? null,
    rework_count: (r.rework_count as number) ?? 0,
    due_date: (r.due_date as string | null) ?? null,
    completed_at: (r.completed_at as string | null) ?? null,
    paid_at: (r.paid_at as string | null) ?? null,
    created_at: r.created_at as string,
    updated_at: r.updated_at as string,
  };
  if (r.a_id) task.assignee = { id: r.a_id as string, name: r.a_name as string, avatar_url: (r.a_avatar as string | null) ?? null };
  if (r.r_id) task.reviewer = { id: r.r_id as string, name: r.r_name as string, avatar_url: (r.r_avatar as string | null) ?? null };
  if (r.p_id) task.project = { id: r.p_id as string, title: r.p_title as string };
  if (r.m_id) task.milestone = { id: r.m_id as string, title: r.m_title as string };
  return task;
}

function toAudit(r: Row): AuditLogEntry {
  return {
    id: r.id as string,
    workspace_id: r.workspace_id as string,
    user_id: (r.user_id as string | null) ?? null,
    action: r.action as string,
    entity_type: (r.entity_type as string | null) ?? null,
    entity_id: (r.entity_id as string | null) ?? null,
    metadata: JSON.parse((r.metadata as string) ?? "{}"),
    created_at: r.created_at as string,
  };
}

// ============================================================================
//  Registration / users
// ============================================================================

export function getUserByEmail(email: string): (User & { password_hash: string }) | null {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.trim().toLowerCase()) as Row | undefined;
  return row ? ({ ...toUser(row), password_hash: row.password_hash as string }) : null;
}

export function getUserById(id: string): User | null {
  const row = getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as Row | undefined;
  return row ? toUser(row) : null;
}

export function listWorkspaceUsers(wid: string): User[] {
  return (getDb()
    .prepare("SELECT * FROM users WHERE workspace_id = ? ORDER BY created_at ASC")
    .all(wid) as Row[]).map(toUser);
}

export function countWorkspaceUsers(wid: string): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS c FROM users WHERE workspace_id = ?")
      .get(wid) as { c: number }
  ).c;
}

export function countActiveWorkspaceUsers(wid: string): number {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS c FROM users WHERE workspace_id = ? AND is_active = 1")
      .get(wid) as { c: number }
  ).c;
}

export function createWorkspaceWithOwner(
  workspaceName: string,
  userName: string,
  email: string,
  passwordHash: string
): { workspaceId: string; userId: string } {
  const db = getDb();
  const wsId = newId();
  const userId = newId();
  const run = db.transaction(() => {
    db.prepare(
      "INSERT INTO workspaces (id, name, plan, max_users, max_projects) VALUES (?, ?, 'free', 3, 3)"
    ).run(wsId, workspaceName);
    db.prepare(
      `INSERT INTO users (id, workspace_id, name, email, password_hash, role, roles)
       VALUES (?, ?, ?, ?, ?, 'owner', '["owner"]')`
    ).run(userId, wsId, userName, email.trim().toLowerCase(), passwordHash);
    writeAudit(wsId, userId, "workspace.created", "workspace", wsId, { name: workspaceName });
  });
  run();
  return { workspaceId: wsId, userId };
}

export function updateUserRoles(userId: string, roles: UserRole[]): void {
  getDb()
    .prepare("UPDATE users SET role = ?, roles = ? WHERE id = ?")
    .run(roles[0], JSON.stringify(roles), userId);
}

export function setUserActive(userId: string, isActive: boolean): void {
  getDb().prepare("UPDATE users SET is_active = ? WHERE id = ?").run(isActive ? 1 : 0, userId);
}

export function resetUserPassword(userId: string, passwordHash: string): void {
  getDb().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
}

export function moveUserToWorkspace(userId: string, workspaceId: string, roles: UserRole[]): void {
  getDb()
    .prepare("UPDATE users SET workspace_id = ?, role = ?, roles = ?, is_active = 1 WHERE id = ?")
    .run(workspaceId, roles[0], JSON.stringify(roles), userId);
}

// ============================================================================
//  Workspace
// ============================================================================

export function getWorkspaceById(id: string): Workspace | null {
  const r = getDb().prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as Row | undefined;
  if (!r) return null;
  return {
    id: r.id as string,
    name: r.name as string,
    logo_url: (r.logo_url as string | null) ?? null,
    company_details: JSON.parse((r.company_details as string) ?? "{}") as CompanyDetails,
    plan: r.plan as Workspace["plan"],
    license_key: (r.license_key as string | null) ?? null,
    max_users: r.max_users as number,
    max_projects: (r.max_projects as number | null) ?? null,
    expires_at: (r.expires_at as string | null) ?? null,
    created_at: r.created_at as string,
  };
}

export function updateWorkspace(
  wid: string,
  fields: Partial<Pick<Workspace, "name" | "logo_url">> & {
    company_details?: CompanyDetails;
  }
): void {
  const db = getDb();
  if (fields.name !== undefined)
    db.prepare("UPDATE workspaces SET name = ? WHERE id = ?").run(fields.name, wid);
  if (fields.logo_url !== undefined)
    db.prepare("UPDATE workspaces SET logo_url = ? WHERE id = ?").run(fields.logo_url, wid);
  if (fields.company_details !== undefined)
    db.prepare("UPDATE workspaces SET company_details = ? WHERE id = ?").run(
      JSON.stringify(fields.company_details),
      wid
    );
}

// ============================================================================
//  Projects
// ============================================================================

export function listProjects(wid: string): Project[] {
  return (getDb()
    .prepare("SELECT * FROM projects WHERE workspace_id = ? ORDER BY created_at DESC")
    .all(wid) as Row[]).map(toProject);
}

export function listActiveProjectsBrief(wid: string): { id: string; title: string; budget: number | null; status: string }[] {
  return getDb()
    .prepare(
      "SELECT id, title, budget, status FROM projects WHERE workspace_id = ? AND status = 'active'"
    )
    .all(wid) as { id: string; title: string; budget: number | null; status: string }[];
}

export function countProjects(wid: string): number {
  return (
    getDb().prepare("SELECT COUNT(*) AS c FROM projects WHERE workspace_id = ?").get(wid) as {
      c: number;
    }
  ).c;
}

export function getProject(wid: string, id: string): Project | null {
  const r = getDb()
    .prepare("SELECT * FROM projects WHERE id = ? AND workspace_id = ?")
    .get(id, wid) as Row | undefined;
  return r ? toProject(r) : null;
}

export function createProject(
  wid: string,
  data: Pick<Project, "title"> &
    Partial<Pick<Project, "description" | "budget" | "target_date" | "status">>,
  creatorId: string
): Project {
  const db = getDb();
  const id = newId();
  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO projects (id, workspace_id, title, description, budget, target_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      wid,
      data.title,
      data.description ?? null,
      data.budget ?? 0,
      data.target_date ?? null,
      data.status ?? "active"
    );
    db.prepare(
      `INSERT INTO project_members (id, project_id, user_id, role)
       VALUES (?, ?, ?, 'lead')
       ON CONFLICT (project_id, user_id) DO NOTHING`
    ).run(newId(), id, creatorId);
    writeAudit(wid, creatorId, "project.created", "project", id, { title: data.title });
  });
  run();
  return getProject(wid, id)!;
}

export function updateProject(
  wid: string,
  id: string,
  data: Partial<Pick<Project, "title" | "description" | "budget" | "target_date" | "status">>,
  actorId?: string
): void {
  const db = getDb();
  const run = db.transaction(() => {
    db.prepare(
      `UPDATE projects SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         budget = COALESCE(?, budget),
         target_date = COALESCE(?, target_date),
         status = COALESCE(?, status)
       WHERE id = ? AND workspace_id = ?`
    ).run(
      data.title ?? null,
      data.description ?? null,
      data.budget ?? null,
      data.target_date ?? null,
      data.status ?? null,
      id,
      wid
    );
    if (actorId) writeAudit(wid, actorId, "project.updated", "project", id);
  });
  run();
}

export function deleteProject(wid: string, id: string, actorId?: string): void {
  const db = getDb();
  const run = db.transaction(() => {
    db.prepare("DELETE FROM projects WHERE id = ? AND workspace_id = ?").run(id, wid);
    if (actorId) writeAudit(wid, actorId, "project.deleted", "project", id);
  });
  run();
}

// ============================================================================
//  Milestones
// ============================================================================

export function listMilestonesForWorkspace(wid: string): (Milestone & { project_id: string })[] {
  return getDb()
    .prepare(
      `SELECT m.* FROM milestones m
       JOIN projects p ON p.id = m.project_id
       WHERE p.workspace_id = ?
       ORDER BY m.order_index`
    )
    .all(wid) as (Milestone & { project_id: string })[];
}

export function listMilestonesForProject(wid: string, projectId: string): Milestone[] {
  return getDb()
    .prepare(
      `SELECT m.* FROM milestones m
       JOIN projects p ON p.id = m.project_id
       WHERE m.project_id = ? AND p.workspace_id = ?
       ORDER BY m.order_index`
    )
    .all(projectId, wid) as Milestone[];
}

export function createMilestone(
  wid: string,
  projectId: string,
  title: string,
  orderIndex: number
): Milestone | null {
  const db = getDb();
  const project = getProject(wid, projectId);
  if (!project) return null;
  const id = newId();
  db.prepare(
    "INSERT INTO milestones (id, project_id, title, order_index) VALUES (?, ?, ?, ?)"
  ).run(id, projectId, title, orderIndex);
  return db.prepare("SELECT * FROM milestones WHERE id = ?").get(id) as Milestone;
}

export function deleteMilestone(wid: string, id: string): void {
  getDb()
    .prepare(
      `DELETE FROM milestones WHERE id = ? AND project_id IN
        (SELECT id FROM projects WHERE workspace_id = ?)`
    )
    .run(id, wid);
}

// ============================================================================
//  Tasks (always workspace-scoped)
// ============================================================================

export function listTasks(
  wid: string,
  opts: { assigneeId?: string; stage?: TaskStage; projectId?: string; limit?: number } = {}
): TaskWithRelations[] {
  const conditions = ["t.workspace_id = ?"];
  const params: unknown[] = [wid];
  if (opts.assigneeId) {
    conditions.push("t.assignee_id = ?");
    params.push(opts.assigneeId);
  }
  if (opts.stage) {
    conditions.push("t.stage = ?");
    params.push(opts.stage);
  }
  if (opts.projectId) {
    conditions.push("t.project_id = ?");
    params.push(opts.projectId);
  }
  let sql = `${TASK_JOIN_SQL} WHERE ${conditions.join(" AND ")} ORDER BY t.created_at DESC`;
  if (opts.limit) sql += ` LIMIT ${Math.floor(opts.limit)}`;
  return (getDb().prepare(sql).all(...params) as Row[]).map(toTask);
}

export function getTask(wid: string, id: string): TaskWithRelations | null {
  const r = getDb()
    .prepare(`${TASK_JOIN_SQL} WHERE t.workspace_id = ? AND t.id = ?`)
    .get(wid, id) as Row | undefined;
  return r ? toTask(r) : null;
}

export interface TaskInput {
  project_id: string;
  milestone_id?: string | null;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  stage?: TaskStage;
  title: string;
  description?: string | null;
  yandex_disk_link?: string | null;
  cost?: number | null;
  due_date?: string | null;
}

export function createTask(wid: string, actorId: string | undefined, data: TaskInput): Task | null {
  const db = getDb();
  const project = getProject(wid, data.project_id);
  if (!project) return null;
  const id = newId();
  db.prepare(
    `INSERT INTO tasks (id, workspace_id, project_id, milestone_id, assignee_id, reviewer_id,
       stage, title, description, yandex_disk_link, cost, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    wid,
    data.project_id,
    data.milestone_id ?? null,
    data.assignee_id ?? null,
    data.reviewer_id ?? null,
    data.stage ?? "brief",
    data.title,
    data.description ?? null,
    data.yandex_disk_link ?? null,
    data.cost ?? 0,
    data.due_date ?? null
  );
  if (actorId) writeAudit(wid, actorId, "task.created", "task", id, { title: data.title });
  return getTask(wid, id);
}

export function updateTask(
  wid: string,
  actorId: string | undefined,
  id: string,
  data: Partial<TaskInput & { completed_at: string | null; paid_at: string | null; rework_count: number }>
): void {
  const db = getDb();
  const sets: string[] = [];
  const params: unknown[] = [];

  const columns: [keyof typeof data, string][] = [
    ["project_id", "project_id"],
    ["milestone_id", "milestone_id"],
    ["assignee_id", "assignee_id"],
    ["reviewer_id", "reviewer_id"],
    ["stage", "stage"],
    ["title", "title"],
    ["description", "description"],
    ["yandex_disk_link", "yandex_disk_link"],
    ["cost", "cost"],
    ["due_date", "due_date"],
    ["completed_at", "completed_at"],
    ["paid_at", "paid_at"],
    ["rework_count", "rework_count"],
  ];

  for (const [key, col] of columns) {
    const value = data[key];
    if (value !== undefined) {
      sets.push(`${col} = ?`);
      params.push(value);
    }
  }
  if (sets.length === 0) return;

  params.push(id, wid);
  const run = db.transaction(() => {
    db.prepare(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND workspace_id = ?`
    ).run(...params);
    if (actorId) writeAudit(wid, actorId, "task.updated", "task", id, data as Record<string, unknown>);
  });
  run();
}

export function deleteTask(wid: string, actorId: string | undefined, id: string): void {
  const db = getDb();
  const run = db.transaction(() => {
    db.prepare("DELETE FROM tasks WHERE id = ? AND workspace_id = ?").run(id, wid);
    if (actorId) writeAudit(wid, actorId, "task.deleted", "task", id);
  });
  run();
}

// ============================================================================
//  STP checklists
// ============================================================================

export function getStpChecklists(
  wid: string
): Record<string, StpChecklistItem[]> {
  const rows = getDb()
    .prepare("SELECT stage, items FROM stp_checklists WHERE workspace_id = ?")
    .all(wid) as { stage: string; items: string }[];
  const result: Record<string, StpChecklistItem[]> = {};
  for (const row of rows) {
    result[row.stage] = JSON.parse(row.items) as StpChecklistItem[];
  }
  return result;
}

export function upsertStpChecklist(
  wid: string,
  stage: TaskStage,
  items: StpChecklistItem[]
): void {
  getDb()
    .prepare(
      `INSERT INTO stp_checklists (id, workspace_id, stage, items) VALUES (?, ?, ?, ?)
       ON CONFLICT (workspace_id, stage) DO UPDATE SET items = excluded.items`
    )
    .run(newId(), wid, stage, JSON.stringify(items));
}

// ============================================================================
//  Price catalog / multipliers
// ============================================================================

export function listCatalog(wid: string): PriceCatalogItem[] {
  return getDb()
    .prepare("SELECT * FROM price_catalog WHERE workspace_id = ? ORDER BY category, operation_name")
    .all(wid) as PriceCatalogItem[];
}

export function upsertCatalogItem(
  wid: string,
  item: Partial<PriceCatalogItem> & { operation_name: string }
): void {
  const db = getDb();
  if (item.id) {
    db.prepare(
      `UPDATE price_catalog SET operation_name = ?, category = ?, base_price = ?, unit = ?
       WHERE id = ? AND workspace_id = ?`
    ).run(item.operation_name, item.category ?? "general", item.base_price ?? 0, item.unit ?? "pc", item.id, wid);
  } else {
    db.prepare(
      `INSERT INTO price_catalog (id, workspace_id, operation_name, category, base_price, unit)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(newId(), wid, item.operation_name, item.category ?? "general", item.base_price ?? 0, item.unit ?? "pc");
  }
}

export function deleteCatalogItem(wid: string, id: string): void {
  getDb().prepare("DELETE FROM price_catalog WHERE id = ? AND workspace_id = ?").run(id, wid);
}

export function listMultipliers(wid: string): PriceMultiplier[] {
  return getDb()
    .prepare("SELECT * FROM price_multipliers WHERE workspace_id = ? ORDER BY name")
    .all(wid) as PriceMultiplier[];
}

export function upsertMultiplier(
  wid: string,
  item: Partial<PriceMultiplier> & { name: string }
): void {
  const db = getDb();
  if (item.id) {
    db.prepare(
      `UPDATE price_multipliers SET name = ?, value = ?, applies_to = ?
       WHERE id = ? AND workspace_id = ?`
    ).run(item.name, item.value ?? 1, item.applies_to ?? "all", item.id, wid);
  } else {
    db.prepare(
      `INSERT INTO price_multipliers (id, workspace_id, name, value, applies_to)
       VALUES (?, ?, ?, ?, ?)`
    ).run(newId(), wid, item.name, item.value ?? 1, item.applies_to ?? "all");
  }
}

export function deleteMultiplier(wid: string, id: string): void {
  getDb().prepare("DELETE FROM price_multipliers WHERE id = ? AND workspace_id = ?").run(id, wid);
}

// ============================================================================
//  Project members
// ============================================================================

export function listProjectMembers(wid: string, projectId: string): ProjectMemberWithUser[] {
  return getDb()
    .prepare(
      `SELECT pm.*, u.name AS user_name, u.email AS user_email,
              u.avatar_url AS user_avatar_url, u.role AS user_workspace_role
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       JOIN projects p ON p.id = pm.project_id
       WHERE pm.project_id = ? AND p.workspace_id = ?
       ORDER BY pm.created_at DESC`
    )
    .all(projectId, wid) as ProjectMemberWithUser[];
}

export function addProjectMember(
  wid: string,
  projectId: string,
  userId: string,
  role: ProjectMember["role"]
): boolean {
  const db = getDb();
  const project = getProject(wid, projectId);
  if (!project) return false;
  const user = getUserById(userId);
  if (!user || user.workspace_id !== wid) return false;
  db.prepare(
    `INSERT INTO project_members (id, project_id, user_id, role) VALUES (?, ?, ?, ?)
     ON CONFLICT (project_id, user_id) DO UPDATE SET role = excluded.role`
  ).run(newId(), projectId, userId, role);
  return true;
}

export function removeProjectMember(wid: string, projectId: string, userId: string): void {
  getDb()
    .prepare(
      `DELETE FROM project_members WHERE project_id = ? AND user_id = ? AND project_id IN
        (SELECT id FROM projects WHERE workspace_id = ?)`
    )
    .run(projectId, userId, wid);
}

export function updateProjectMemberRoleById(
  wid: string,
  memberId: string,
  role: ProjectMember["role"]
): boolean {
  const res = getDb()
    .prepare(
      `UPDATE project_members SET role = ?
       WHERE id = ? AND project_id IN (SELECT id FROM projects WHERE workspace_id = ?)`
    )
    .run(role, memberId, wid);
  return res.changes > 0;
}

export function removeProjectMemberById(wid: string, memberId: string): boolean {
  const res = getDb()
    .prepare(
      `DELETE FROM project_members WHERE id = ? AND project_id IN
        (SELECT id FROM projects WHERE workspace_id = ?)`
    )
    .run(memberId, wid);
  return res.changes > 0;
}

// ============================================================================
//  Audit log
// ============================================================================

export function writeAudit(
  wid: string,
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata: Record<string, unknown> = {}
): void {
  getDb()
    .prepare(
      `INSERT INTO audit_log (id, workspace_id, user_id, action, entity_type, entity_id, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(newId(), wid, userId, action, entityType ?? null, entityId ?? null, JSON.stringify(metadata));
}

export function listAuditLog(wid: string, limit = 100): AuditLogEntry[] {
  return (getDb()
    .prepare("SELECT * FROM audit_log WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(wid, limit) as Row[]).map(toAudit);
}

// ============================================================================
//  Analytics helpers
// ============================================================================

export function listAnalyticsTasks(
  wid: string
): { id: string; project_id: string; stage: TaskStage; cost: number | null; rework_count: number; assignee_id: string | null; completed_at: string | null; created_at: string }[] {
  return getDb()
    .prepare(
      "SELECT id, project_id, stage, cost, rework_count, assignee_id, completed_at, created_at FROM tasks WHERE workspace_id = ?"
    )
    .all(wid) as never;
}

export function listAnalyticsProjects(
  wid: string
): { id: string; title: string; budget: number | null; status: string; target_date: string | null; created_at: string }[] {
  return getDb()
    .prepare("SELECT id, title, budget, status, target_date, created_at FROM projects WHERE workspace_id = ? ORDER BY created_at DESC")
    .all(wid) as never;
}

export function listAnalyticsEngineers(
  wid: string
): { id: string; name: string; role: string }[] {
  return getDb()
    .prepare(
      `SELECT id, name, role FROM users
       WHERE workspace_id = ? AND is_active = 1
         AND role IN ('engineer','freelancer','reviewer')`
    )
    .all(wid) as never;
}
