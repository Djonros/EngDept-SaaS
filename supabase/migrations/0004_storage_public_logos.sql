-- ============================================================================
--  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
--  All rights reserved.
-- ============================================================================

-- 0004_storage_public_logos.sql
-- Make workspace-files bucket public so logo URLs are accessible

UPDATE storage.buckets
SET public = true
WHERE id = 'workspace-files';
