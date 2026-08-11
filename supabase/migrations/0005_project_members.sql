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
--  ENG-DEPT SaaS — 0005: Project members (per-project roles)
--  Adds granular team assignment for each project.
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- ---------- Enum: project_member_role ----------
DO $$ BEGIN
  CREATE TYPE project_member_role AS ENUM (
    'lead',       -- руководитель проекта
    'engineer',   -- инженер-конструктор
    'reviewer',   -- нормоконтролёр / проверяющий
    'observer'    -- наблюдатель (только чтение)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
--  11. project_members
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_members (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role         project_member_role NOT NULL DEFAULT 'engineer',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user    ON public.project_members(user_id);

-- ============================================================================
--  RLS — Enable
-- ============================================================================
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
--  RLS — Policies
--  Pattern: members filtered via project → workspace (like milestones)
-- ============================================================================

-- Helper: project belongs to current workspace
CREATE POLICY p_project_members_select ON public.project_members
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

CREATE POLICY p_project_members_insert ON public.project_members
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

CREATE POLICY p_project_members_update ON public.project_members
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

CREATE POLICY p_project_members_delete ON public.project_members
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE workspace_id = public.current_workspace_id()
    )
  );

-- ============================================================================
--  View: project_members_with_user (joins users for easy UI consumption)
-- ============================================================================
CREATE OR REPLACE VIEW public.project_members_with_user AS
SELECT
    pm.id,
    pm.project_id,
    pm.user_id,
    pm.role,
    pm.created_at,
    u.name        AS user_name,
    u.email       AS user_email,
    u.avatar_url  AS user_avatar_url,
    u.role        AS user_workspace_role
FROM public.project_members pm
JOIN public.users u ON u.id = pm.user_id;

-- ============================================================================
--  Trigger: auto-assign project creator as 'lead' on project insert
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_assign_project_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NOT NULL THEN
        INSERT INTO public.project_members (project_id, user_id, role)
        VALUES (NEW.id, v_uid, 'lead')
        ON CONFLICT (project_id, user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_auto_project_lead
    AFTER INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.auto_assign_project_lead();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
