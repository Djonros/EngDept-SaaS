-- ============================================================================
--  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
--  All rights reserved.
-- ============================================================================

-- 0003_add_workspace_logo.sql
-- Logo URL for workspace branding

ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS logo_url TEXT;
