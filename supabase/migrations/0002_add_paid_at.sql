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

-- 0002_add_paid_at.sql
-- Track when a freelancer task was paid

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS paid_at timestamptz;
