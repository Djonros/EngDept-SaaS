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
import { listCatalog, listMultipliers } from "@/lib/repo";
import { CatalogManager } from "@/components/catalog-manager";
import { PlanPaywall } from "@/components/plan-paywall";
import { hasFeature } from "@/lib/plans";
import type { PriceCatalogItem, PriceMultiplier } from "@/lib/types";

export default async function CatalogPage() {
  const session = await requireStaffSession();
  if (!hasFeature(session.workspace.plan, "catalog")) {
    return <PlanPaywall feature="catalog" />;
  }
  const wid = session.workspace.id;

  const items = listCatalog(wid) as PriceCatalogItem[];
  const multipliers = listMultipliers(wid) as PriceMultiplier[];

  return (
    <CatalogManager
      items={items}
      multipliers={multipliers}
      workspaceId={wid}
    />
  );
}
