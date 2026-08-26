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
--  ENG-DEPT SaaS — 0007: Multiple roles per user
--  Adds roles[] array alongside the existing role column.
--  Run in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- Add roles array column
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS roles user_role[] NOT NULL DEFAULT '{}'::user_role[];

-- Backfill: copy existing single role into array (skip if already populated)
UPDATE public.users
  SET roles = ARRAY[role]
  WHERE roles = '{}'::user_role[];
