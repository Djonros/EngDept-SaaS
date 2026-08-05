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

import { requireSession } from "@/lib/session";
import { createServerClient } from "@/lib/supabase-server";
import { StpManager } from "@/components/stp-manager";
import {
  STAGE_ORDER,
  type TaskStage,
  type StpChecklistItem,
} from "@/lib/types";

export default async function StpPage() {
  const session = await requireSession();
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const { data } = await supabase
    .from("stp_checklists")
    .select("stage, items")
    .eq("workspace_id", wid);

  const checklists = STAGE_ORDER.reduce(
    (acc, stage) => {
      const row = data?.find((r) => r.stage === stage);
      acc[stage] = (row?.items ?? []) as StpChecklistItem[];
      return acc;
    },
    {} as Record<TaskStage, StpChecklistItem[]>
  );

  return (
    <StpManager checklists={checklists} workspaceId={wid} />
  );
}
