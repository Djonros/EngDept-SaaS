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
--  ENG-DEPT SaaS — 0009: Freemium plan limits
--  Adds max_projects to workspaces, tightens free plan limits (3 users / 3
--  projects) and enforces the project limit with a DB trigger.
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS max_projects INT;

ALTER TABLE public.workspaces
  ALTER COLUMN max_users SET DEFAULT 3;

UPDATE public.workspaces SET max_users = 3,  max_projects = 3    WHERE plan = 'free';
UPDATE public.workspaces SET max_users = 25, max_projects = NULL WHERE plan = 'pro';
UPDATE public.workspaces SET max_users = 100, max_projects = NULL WHERE plan = 'enterprise';

CREATE OR REPLACE FUNCTION public.enforce_project_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_projects INT;
BEGIN
  SELECT w.max_projects INTO v_max_projects
  FROM public.workspaces w
  WHERE w.id = NEW.workspace_id;

  IF v_max_projects IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM public.projects p
        WHERE p.workspace_id = NEW.workspace_id) >= v_max_projects THEN
      RAISE EXCEPTION 'Достигнут лимит проектов тарифа (%) — обновите тариф', v_max_projects;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_limit ON public.projects;
CREATE TRIGGER trg_projects_limit
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_limit();
