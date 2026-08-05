// ============================================================================
//  Copyright (c) 2024-2026 Djonros (djonros@gmail.com)
//  All rights reserved.
//
//  This software and its source code are the proprietary property of Djonros.
//  Unauthorized copying, modification, merging, publication, distribution,
//  sublicensing, and/or selling of this software, via any medium, is strictly
//  prohibited without prior written permission from the copyright holder.
//
//  Licensed under the Proprietary License.
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License by contacting: djonros@gmail.com
//
//  Violators will be prosecuted to the maximum extent possible under the law.
// ============================================================================

import { requireStaffSession } from "@/lib/session";
import { createServerClient } from "@/lib/supabase-server";
import { CatalogManager } from "@/components/catalog-manager";
import type { PriceCatalogItem, PriceMultiplier } from "@/lib/types";

export default async function CatalogPage() {
  const session = await requireStaffSession();
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const [{ data: items }, { data: multipliers }] = await Promise.all([
    supabase
      .from("price_catalog")
      .select("*")
      .eq("workspace_id", wid)
      .order("category")
      .order("operation_name"),
    supabase
      .from("price_multipliers")
      .select("*")
      .eq("workspace_id", wid)
      .order("name"),
  ]);

  return (
    <CatalogManager
      items={(items ?? []) as PriceCatalogItem[]}
      multipliers={(multipliers ?? []) as PriceMultiplier[]}
      workspaceId={wid}
    />
  );
}
