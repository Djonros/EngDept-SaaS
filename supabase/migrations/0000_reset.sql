-- ============================================================================
--  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
--  All rights reserved.
-- ============================================================================

-- ============================================================================
--  0000_reset.sql — DESTRUCTIVE: drops all app tables, policies, functions
--  Run this BEFORE 0001_init.sql when the schema is out of sync.
--  ⚠️  This deletes ALL data. Use only in development.
-- ============================================================================

-- ---------- Drop policies (must precede table drops) ----------
DROP POLICY IF EXISTS p_storage_select    ON storage.objects;
DROP POLICY IF EXISTS p_storage_insert    ON storage.objects;
DROP POLICY IF EXISTS p_storage_update    ON storage.objects;
DROP POLICY IF EXISTS p_storage_delete    ON storage.objects;

DROP POLICY IF EXISTS p_audit_select      ON public.audit_log;

DROP POLICY IF EXISTS p_licenses_select   ON public.licenses;
DROP POLICY IF EXISTS p_licenses_update   ON public.licenses;

DROP POLICY IF EXISTS p_mult_select       ON public.price_multipliers;
DROP POLICY IF EXISTS p_mult_insert       ON public.price_multipliers;
DROP POLICY IF EXISTS p_mult_update       ON public.price_multipliers;
DROP POLICY IF EXISTS p_mult_delete       ON public.price_multipliers;

DROP POLICY IF EXISTS p_catalog_select    ON public.price_catalog;
DROP POLICY IF EXISTS p_catalog_insert    ON public.price_catalog;
DROP POLICY IF EXISTS p_catalog_update    ON public.price_catalog;
DROP POLICY IF EXISTS p_catalog_delete    ON public.price_catalog;

DROP POLICY IF EXISTS p_stp_select        ON public.stp_checklists;
DROP POLICY IF EXISTS p_stp_insert        ON public.stp_checklists;
DROP POLICY IF EXISTS p_stp_update        ON public.stp_checklists;
DROP POLICY IF EXISTS p_stp_delete        ON public.stp_checklists;

DROP POLICY IF EXISTS p_tasks_select      ON public.tasks;
DROP POLICY IF EXISTS p_tasks_insert      ON public.tasks;
DROP POLICY IF EXISTS p_tasks_update      ON public.tasks;
DROP POLICY IF EXISTS p_tasks_delete      ON public.tasks;

DROP POLICY IF EXISTS p_milestones_select  ON public.milestones;
DROP POLICY IF EXISTS p_milestones_insert  ON public.milestones;
DROP POLICY IF EXISTS p_milestones_update  ON public.milestones;
DROP POLICY IF EXISTS p_milestones_delete  ON public.milestones;

DROP POLICY IF EXISTS p_projects_select   ON public.projects;
DROP POLICY IF EXISTS p_projects_insert   ON public.projects;
DROP POLICY IF EXISTS p_projects_update   ON public.projects;
DROP POLICY IF EXISTS p_projects_delete   ON public.projects;

DROP POLICY IF EXISTS p_users_select      ON public.users;
DROP POLICY IF EXISTS p_users_insert      ON public.users;
DROP POLICY IF EXISTS p_users_update      ON public.users;

DROP POLICY IF EXISTS p_workspaces_select ON public.workspaces;
DROP POLICY IF EXISTS p_workspaces_update ON public.workspaces;

-- ---------- Drop triggers ----------
DROP TRIGGER IF EXISTS trg_tasks_updated    ON public.tasks;
DROP TRIGGER IF EXISTS trg_projects_updated ON public.projects;

-- ---------- Drop functions ----------
DROP FUNCTION IF EXISTS public.create_workspace_with_owner(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.set_updated_at();
DROP FUNCTION IF EXISTS public.current_workspace_id();

-- ---------- Drop tables (order matters: dependents first) ----------
DROP TABLE IF EXISTS public.audit_log         CASCADE;
DROP TABLE IF EXISTS public.licenses          CASCADE;
DROP TABLE IF EXISTS public.price_multipliers CASCADE;
DROP TABLE IF EXISTS public.price_catalog     CASCADE;
DROP TABLE IF EXISTS public.stp_checklists    CASCADE;
DROP TABLE IF EXISTS public.tasks             CASCADE;
DROP TABLE IF EXISTS public.milestones        CASCADE;
DROP TABLE IF EXISTS public.projects          CASCADE;
DROP TABLE IF EXISTS public.users             CASCADE;
DROP TABLE IF EXISTS public.workspaces        CASCADE;

-- ---------- Storage bucket ----------
-- Supabase doesn't allow direct DELETE from storage.buckets.
-- The 'workspace-files' bucket is created by 0001_init.sql with ON CONFLICT DO NOTHING,
-- so no cleanup needed here. Remove old objects via Dashboard → Storage UI if necessary.

-- ---------- Drop enums ----------
DROP TYPE IF EXISTS public.license_status;
DROP TYPE IF EXISTS public.task_stage;
DROP TYPE IF EXISTS public.user_role;
