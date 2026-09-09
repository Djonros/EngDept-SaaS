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
import { getProject, listTasks } from "@/lib/repo";
import { PaymentDocument } from "@/components/payment-document";
import { PlanPaywall } from "@/components/plan-paywall";
import { hasFeature } from "@/lib/plans";
import type { CompanyDetails, Project, TaskWithRelations } from "@/lib/types";

export default async function PaymentDocPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await requireSession();
  if (!hasFeature(session.workspace.plan, "payment-doc")) {
    return <PlanPaywall feature="payment-doc" />;
  }
  const wid = session.workspace.id;

  const project = getProject(wid, params.id);
  if (!project) notFound();

  const tasks = listTasks(wid, { projectId: params.id });

  const companyDetails =
    (session.workspace.company_details as CompanyDetails) ?? {};

  return (
    <PaymentDocument
      project={project as Project}
      tasks={tasks as unknown as TaskWithRelations[]}
      companyName={session.workspace.name}
      logoUrl={session.workspace.logo_url}
      companyDetails={companyDetails}
    />
  );
}
