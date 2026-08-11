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

import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { createServerClient } from "@/lib/supabase-server";
import { PaymentDocument } from "@/components/payment-document";
import type { CompanyDetails, Project, TaskWithRelations } from "@/lib/types";

export default async function PaymentDocPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  const supabase = createServerClient();
  const wid = session.workspace.id;

  const [{ data: project, error }, { data: tasks }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .eq("workspace_id", wid)
      .single(),
    supabase
      .from("tasks")
      .select(
        `*,
        assignee:users!assignee_id(id, name, email),
        reviewer:users!reviewer_id(id, name, avatar_url),
        project:projects(id, title),
        milestone:milestones(id, title)`
      )
      .eq("project_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  if (error || !project) notFound();

  const companyDetails =
    (session.workspace.company_details as CompanyDetails) ?? {};

  return (
    <PaymentDocument
      project={project as Project}
      tasks={(tasks ?? []) as unknown as TaskWithRelations[]}
      companyName={session.workspace.name}
      logoUrl={session.workspace.logo_url}
      companyDetails={companyDetails}
    />
  );
}
