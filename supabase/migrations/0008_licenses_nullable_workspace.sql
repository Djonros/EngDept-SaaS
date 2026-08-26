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
--  ENG-DEPT SaaS — 0008: Licenses with unbound workspace
--  Allows generating license keys before they are assigned to a workspace.
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- Allow licenses without a workspace (not yet activated)
ALTER TABLE public.licenses
  ALTER COLUMN workspace_id DROP NOT NULL;
