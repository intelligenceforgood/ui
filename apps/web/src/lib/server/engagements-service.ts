"use server";

import { apiFetch } from "./api-client";
import type {
  Engagement,
  EngagementCreate,
  EngagementUpdate,
  EngagementSummary,
  CaseAssignmentResult,
} from "@i4g/sdk";

export async function listEngagements(status?: string): Promise<Engagement[]> {
  const queryParams: Record<string, string> = {};
  if (status) queryParams.status = status;
  return apiFetch<Engagement[]>("/engagements", { queryParams });
}

export async function getEngagement(id: string): Promise<Engagement> {
  return apiFetch<Engagement>(`/engagements/${encodeURIComponent(id)}`);
}

export async function createEngagement(
  data: EngagementCreate,
): Promise<Engagement> {
  return apiFetch<Engagement>("/engagements", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateEngagement(
  id: string,
  data: EngagementUpdate,
): Promise<Engagement> {
  return apiFetch<Engagement>(`/engagements/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteEngagement(id: string): Promise<void> {
  await apiFetch(`/engagements/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function assignCases(
  id: string,
  caseIds: string[],
): Promise<CaseAssignmentResult> {
  return apiFetch<CaseAssignmentResult>(
    `/engagements/${encodeURIComponent(id)}/cases`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_ids: caseIds }),
    },
  );
}

export async function removeCases(
  id: string,
  caseIds: string[],
): Promise<CaseAssignmentResult> {
  return apiFetch<CaseAssignmentResult>(
    `/engagements/${encodeURIComponent(id)}/cases`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_ids: caseIds }),
    },
  );
}

export async function getEngagementSummary(
  id: string,
): Promise<EngagementSummary> {
  return apiFetch<EngagementSummary>(
    `/engagements/${encodeURIComponent(id)}/summary`,
  );
}
