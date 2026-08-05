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
//  Database types — mirror of supabase/migrations/0001_init.sql
// ============================================================================

export type UserRole = "owner" | "manager" | "engineer" | "freelancer" | "reviewer";

export type TaskStage = "brief" | "concept" | "3d" | "2d" | "calc" | "review" | "done";

export type LicenseStatus = "active" | "expired" | "revoked";

export type Plan = "free" | "pro" | "enterprise";

export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Активный",
  on_hold: "На паузе",
  completed: "Завершён",
  cancelled: "Отменён",
};

export interface Workspace {
  id: string;
  name: string;
  plan: Plan;
  license_key: string | null;
  max_users: number;
  expires_at: string | null;
  created_at: string;
}

export interface User {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  role: UserRole;
  telegram_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  budget: number | null;
  target_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  project_id: string;
  milestone_id: string | null;
  assignee_id: string | null;
  reviewer_id: string | null;
  stage: TaskStage;
  title: string;
  description: string | null;
  yandex_disk_link: string | null;
  cost: number | null;
  rework_count: number;
  due_date: string | null;
  completed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StpChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface StpChecklist {
  id: string;
  workspace_id: string;
  stage: TaskStage;
  items: StpChecklistItem[];
  created_at: string;
}

export interface PriceCatalogItem {
  id: string;
  workspace_id: string;
  operation_name: string;
  category: "general" | "3d" | "2d" | "calc" | "documentation" | "other";
  base_price: number;
  unit: "pc" | "hour" | "sheet" | "assembly" | "drawing";
  created_at: string;
}

export interface PriceMultiplier {
  id: string;
  workspace_id: string;
  name: string;
  value: number;
  applies_to: "all" | "3d" | "2d" | "calc" | "documentation";
  created_at: string;
}

export interface License {
  id: string;
  workspace_id: string;
  key: string;
  plan: Plan;
  activated_at: string;
  expires_at: string | null;
  hardware_id: string | null;
  status: LicenseStatus;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  workspace_id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Task with joined relations (for kanban / detail views)
export interface TaskWithRelations extends Task {
  assignee?: Pick<User, "id" | "name" | "avatar_url"> | null;
  reviewer?: Pick<User, "id" | "name" | "avatar_url"> | null;
  project?: Pick<Project, "id" | "title"> | null;
  milestone?: Pick<Milestone, "id" | "title"> | null;
}

export const STAGE_ORDER: TaskStage[] = [
  "brief",
  "concept",
  "3d",
  "2d",
  "calc",
  "review",
  "done",
];

export const STAGE_LABELS: Record<TaskStage, string> = {
  brief: "ТЗ",
  concept: "Концепт",
  "3d": "3D-модель",
  "2d": "2D-чертежи",
  calc: "Расчёты",
  review: "Нормоконтроль",
  done: "Готово",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Владелец",
  manager: "Менеджер",
  engineer: "Инженер",
  freelancer: "Фрилансер",
  reviewer: "Нормоконтролёр",
};

export const CATEGORY_LABELS: Record<string, string> = {
  general: "Общее",
  "3d": "3D",
  "2d": "2D",
  calc: "Расчёты",
  documentation: "Документация",
  other: "Другое",
};

export const UNIT_LABELS: Record<string, string> = {
  pc: "шт",
  hour: "час",
  sheet: "лист",
  assembly: "сборка",
  drawing: "чертёж",
};

export const APPLIES_TO_LABELS: Record<string, string> = {
  all: "Все",
  "3d": "3D",
  "2d": "2D",
  calc: "Расчёты",
  documentation: "Документация",
};
