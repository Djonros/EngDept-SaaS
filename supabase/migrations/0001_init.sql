-- ============================================================================
--  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
--  All rights reserved.
--
--  This software and its source code are the proprietary property of Djonros.
--  Unauthorized copying, modification, merging, publication, distribution,
--  sublicensing, and/or selling of this software, via any medium, is strictly
--  prohibited without prior written permission from the copyright holder.
--
--  Violators will be prosecuted to the maximum extent possible under the law.
-- ============================================================================

-- ============================================================================
--  ENG-DEPT SaaS — Database Schema & RLS
--  Multi-tenant workspace isolation (Supabase / PostgreSQL 15+)
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Enums ----------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner','manager','engineer','freelancer','reviewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_stage AS ENUM ('brief','concept','3d','2d','calc','review','done');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE license_status AS ENUM ('active','expired','revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
--  Helper: current user's workspace_id  (used by every RLS policy)
--  NOTE: Defined AFTER the users table is created, because PostgreSQL
--  validates SQL function bodies at creation time (check_function_bodies = on).
--  See bottom of file for the actual CREATE FUNCTION statement.
-- ============================================================================

-- ============================================================================
--  1. workspaces
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT        NOT NULL,
    plan        TEXT        NOT NULL DEFAULT 'free'
                  CHECK (plan IN ('free','pro','enterprise')),
    license_key TEXT        UNIQUE,
    max_users   INT         NOT NULL DEFAULT 5,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
--  2. users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    role         user_role NOT NULL DEFAULT 'engineer',
    telegram_id  TEXT,
    avatar_url   TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_workspace ON public.users(workspace_id);

-- ============================================================================
--  Helper: current user's workspace_id  (used by every RLS policy)
--  Defined here because PostgreSQL validates SQL function bodies at creation.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
--  3. projects
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    budget      DECIMAL(14,2) DEFAULT 0,
    target_date DATE,
    status      TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','on_hold','completed','cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);

-- ============================================================================
--  4. milestones
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.milestones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    order_index INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones(project_id);

-- ============================================================================
--  5. tasks
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id     UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id     UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    assignee_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewer_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    stage            task_stage NOT NULL DEFAULT 'brief',
    title            TEXT NOT NULL,
    description      TEXT,
    yandex_disk_link TEXT,
    cost             DECIMAL(14,2) DEFAULT 0,
    rework_count     INT  NOT NULL DEFAULT 0,
    due_date         DATE,
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace  ON public.tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project    ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee   ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone  ON public.tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage      ON public.tasks(stage);

-- ============================================================================
--  6. stp_checklists  (нормоконтроль / СТП)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.stp_checklists (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    stage        task_stage NOT NULL,
    items        JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stp_workspace ON public.stp_checklists(workspace_id);

-- ============================================================================
--  7. price_catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.price_catalog (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id   UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    operation_name TEXT NOT NULL,
    category       TEXT NOT NULL DEFAULT 'general'
                     CHECK (category IN ('general','3d','2d','calc','documentation','other')),
    base_price     DECIMAL(14,2) NOT NULL DEFAULT 0,
    unit           TEXT NOT NULL DEFAULT 'pc'
                     CHECK (unit IN ('pc','hour','sheet','assembly','drawing')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_price_catalog_workspace ON public.price_catalog(workspace_id);

-- ============================================================================
--  8. price_multipliers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.price_multipliers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    value        DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    applies_to   TEXT NOT NULL DEFAULT 'all'
                   CHECK (applies_to IN ('all','3d','2d','calc','documentation')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_price_mult_workspace ON public.price_multipliers(workspace_id);

-- ============================================================================
--  9. licenses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.licenses (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
    key          TEXT NOT NULL UNIQUE,
    plan         TEXT NOT NULL DEFAULT 'pro'
                   CHECK (plan IN ('free','pro','enterprise')),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ,
    hardware_id  TEXT,
    status       license_status NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_licenses_workspace ON public.licenses(workspace_id);

-- ============================================================================
--  10. audit_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action       TEXT NOT NULL,
    entity_type  TEXT,
    entity_id    UUID,
    metadata     JSONB DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_workspace  ON public.audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_user       ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_log(created_at DESC);

-- ============================================================================
--  updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DO $$ BEGIN
  CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
--  RLS — Enable
-- ============================================================================
ALTER TABLE public.workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stp_checklists   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_catalog    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log        ENABLE ROW LEVEL SECURITY;

-- ============================================================================
--  RLS — Policies
--  Pattern: users see / mutate only rows matching current_workspace_id()
-- ============================================================================

-- ---- workspaces (owner can see own workspace) ----
CREATE POLICY p_workspaces_select ON public.workspaces
  FOR SELECT USING (id = public.current_workspace_id());

CREATE POLICY p_workspaces_update ON public.workspaces
  FOR UPDATE USING (id = public.current_workspace_id())
  WITH CHECK (id = public.current_workspace_id());

-- ---- users ----
CREATE POLICY p_users_select ON public.users
  FOR SELECT USING (workspace_id = public.current_workspace_id());

CREATE POLICY p_users_insert ON public.users
  FOR INSERT WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_users_update ON public.users
  FOR UPDATE USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

-- ---- projects ----
CREATE POLICY p_projects_select ON public.projects
  FOR SELECT USING (workspace_id = public.current_workspace_id());

CREATE POLICY p_projects_insert ON public.projects
  FOR INSERT WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_projects_update ON public.projects
  FOR UPDATE USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_projects_delete ON public.projects
  FOR DELETE USING (workspace_id = public.current_workspace_id());

-- ---- milestones (filtered via project → workspace) ----
CREATE POLICY p_milestones_select ON public.milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

CREATE POLICY p_milestones_insert ON public.milestones
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

CREATE POLICY p_milestones_update ON public.milestones
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

CREATE POLICY p_milestones_delete ON public.milestones
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

-- ---- tasks ----
CREATE POLICY p_tasks_select ON public.tasks
  FOR SELECT USING (workspace_id = public.current_workspace_id());

CREATE POLICY p_tasks_insert ON public.tasks
  FOR INSERT WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_tasks_update ON public.tasks
  FOR UPDATE USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_tasks_delete ON public.tasks
  FOR DELETE USING (workspace_id = public.current_workspace_id());

-- ---- stp_checklists ----
CREATE POLICY p_stp_select ON public.stp_checklists
  FOR SELECT USING (workspace_id = public.current_workspace_id());

CREATE POLICY p_stp_insert ON public.stp_checklists
  FOR INSERT WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_stp_update ON public.stp_checklists
  FOR UPDATE USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_stp_delete ON public.stp_checklists
  FOR DELETE USING (workspace_id = public.current_workspace_id());

-- ---- price_catalog ----
CREATE POLICY p_catalog_select ON public.price_catalog
  FOR SELECT USING (workspace_id = public.current_workspace_id());

CREATE POLICY p_catalog_insert ON public.price_catalog
  FOR INSERT WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_catalog_update ON public.price_catalog
  FOR UPDATE USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_catalog_delete ON public.price_catalog
  FOR DELETE USING (workspace_id = public.current_workspace_id());

-- ---- price_multipliers ----
CREATE POLICY p_mult_select ON public.price_multipliers
  FOR SELECT USING (workspace_id = public.current_workspace_id());

CREATE POLICY p_mult_insert ON public.price_multipliers
  FOR INSERT WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_mult_update ON public.price_multipliers
  FOR UPDATE USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

CREATE POLICY p_mult_delete ON public.price_multipliers
  FOR DELETE USING (workspace_id = public.current_workspace_id());

-- ---- licenses ----
CREATE POLICY p_licenses_select ON public.licenses
  FOR SELECT USING (workspace_id = public.current_workspace_id());

CREATE POLICY p_licenses_update ON public.licenses
  FOR UPDATE USING (workspace_id = public.current_workspace_id())
  WITH CHECK (workspace_id = public.current_workspace_id());

-- ---- audit_log ----
CREATE POLICY p_audit_select ON public.audit_log
  FOR SELECT USING (workspace_id = public.current_workspace_id());

-- (service role inserts audit rows via API — bypasses RLS)

-- ============================================================================
--  Storage bucket for task attachments / avatars
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-files', 'workspace-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can access objects only in a folder named after their workspace
CREATE POLICY p_storage_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
  );

CREATE POLICY p_storage_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
  );

CREATE POLICY p_storage_update ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
  );

CREATE POLICY p_storage_delete ON storage.objects
  FOR DELETE USING (
    bucket_id = 'workspace-files'
    AND (storage.foldername(name))[1] = public.current_workspace_id()::text
  );

-- ============================================================================
--  RPC: create_workspace_with_owner (called once on registration)
--  Inserts workspace + user row in a single atomic call
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_workspace_with_owner(
  p_workspace_name TEXT,
  p_user_name      TEXT,
  p_user_email     TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ws_id UUID;
  v_uid   UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Idempotent: if user already has a profile, return existing workspace
  SELECT workspace_id INTO v_ws_id FROM public.users WHERE id = v_uid;
  IF FOUND THEN
    RETURN v_ws_id;
  END IF;

  INSERT INTO public.workspaces (name)
  VALUES (p_workspace_name)
  RETURNING id INTO v_ws_id;

  INSERT INTO public.users (id, workspace_id, name, email, role)
  VALUES (v_uid, v_ws_id, p_user_name, p_user_email, 'owner');

  RETURN v_ws_id;
END;
$$;
