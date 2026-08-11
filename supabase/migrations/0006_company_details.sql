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
--  ENG-DEPT SaaS — 0006: Company details for payment documents
--  Stores company requisites as JSONB on the workspace row.
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS company_details JSONB NOT NULL DEFAULT '{}'::jsonb;
