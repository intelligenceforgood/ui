"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseInvestigationSummary } from "@i4g/sdk";
import { Card } from "@i4g/ui-kit";
import { Globe } from "lucide-react";

import { useCaseActivity } from "@/hooks/use-case-activity";
import { ActivityBar } from "@/components/case-detail/activity-bar";
import { InvestigationStatusPanel } from "@/components/case-detail/investigation-status-panel";
import { DedupWarningModal } from "@/components/case-detail/dedup-warning-modal";
import { InvestigationHistory } from "@/components/case-detail/investigation-history";
import { FieldHelp } from "@/components/help";

interface DedupState {
  url: string;
  existingScanId: string;
  existingRiskScore: number | null;
  daysSinceScan: number;
}

/* -------------------------------------------------------------------------- */
/*  ActivityBarClient — renders at top of page, handles polling               */
/* -------------------------------------------------------------------------- */

interface ActivityBarClientProps {
  caseId: string;
}

/**
 * Client wrapper for the activity bar with polling.
 * Place between page header and main content grid.
 */
export function ActivityBarClient({ caseId }: ActivityBarClientProps) {
  const router = useRouter();
  const { activities, hasRunning } = useCaseActivity(caseId);

  const handleInvestigationClick = useCallback(
    (scanId: string) => {
      router.push(`/investigations/ssi/${scanId}`);
    },
    [router],
  );

  return (
    <ActivityBar
      activities={activities}
      hasRunning={hasRunning}
      onInvestigationClick={handleInvestigationClick}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  InvestigationPanelClient — renders in right column                        */
/* -------------------------------------------------------------------------- */

interface InvestigationPanelClientProps {
  caseId: string;
  investigations: CaseInvestigationSummary[];
  caseUrls: string[];
}

/**
 * Client wrapper for the investigation status panel and history.
 * Handles investigate/re-investigate triggers and dedup modal.
 * Place in the right column of the case detail grid.
 */
export function InvestigationPanelClient({
  caseId,
  investigations: initialInvestigations,
  caseUrls,
}: InvestigationPanelClientProps) {
  const router = useRouter();
  const { refetch } = useCaseActivity(caseId, { enabled: false });
  const [dedupState, setDedupState] = useState<DedupState | null>(null);
  const [investigations] = useState(initialInvestigations);

  const handleInvestigate = useCallback(
    async (url: string) => {
      try {
        const res = await fetch(`/api/cases/${caseId}/investigate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, force: false }),
        });
        if (!res.ok) throw new Error(`Investigate failed: ${res.status}`);
        const response = await res.json();
        if (
          response.alreadyInvestigated === true &&
          response.triggered === false
        ) {
          setDedupState({
            url,
            existingScanId: response.existingScanId ?? "",
            existingRiskScore: response.existingRiskScore ?? null,
            daysSinceScan: response.daysSinceScan ?? 0,
          });
        } else {
          refetch();
        }
      } catch {
        // Non-critical — user can retry
      }
    },
    [caseId, refetch],
  );

  const handleReinvestigate = useCallback(
    async (url: string) => {
      try {
        await fetch(`/api/cases/${caseId}/investigate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, force: true }),
        });
        refetch();
      } catch {
        // Non-critical — user can retry
      }
    },
    [caseId, refetch],
  );

  const handleViewResult = useCallback(
    (scanId: string) => {
      router.push(`/investigations/ssi/${scanId}`);
    },
    [router],
  );

  const handleDedupReinvestigateSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Group investigations by normalized URL for history display
  const investigationsByUrl = new Map<string, CaseInvestigationSummary[]>();
  for (const inv of investigations) {
    const key = inv.normalizedUrl ?? inv.url;
    const existing = investigationsByUrl.get(key) ?? [];
    existing.push(inv);
    investigationsByUrl.set(key, existing);
  }

  return (
    <>
      <Card className="group p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-medium">
          <Globe className="h-5 w-5 text-slate-400" aria-hidden="true" />
          URL Investigations ({investigations.length})
          <FieldHelp helpKey="case.investigations" />
        </h3>

        <InvestigationStatusPanel
          investigations={investigations}
          caseUrls={caseUrls}
          onInvestigate={handleInvestigate}
          onReinvestigate={(url) => handleReinvestigate(url)}
          onViewResult={handleViewResult}
        />

        {/* Investigation history for URLs with multiple scans */}
        {[...investigationsByUrl.entries()]
          .filter(([, invs]) => invs.length > 1)
          .map(([normalizedUrl, invs]) => (
            <div key={normalizedUrl} className="mt-4">
              <InvestigationHistory
                normalizedUrl={normalizedUrl}
                investigations={invs}
              />
            </div>
          ))}
      </Card>

      {/* Dedup Warning Modal */}
      {dedupState && (
        <DedupWarningModal
          isOpen={true}
          onClose={() => setDedupState(null)}
          caseId={caseId}
          url={dedupState.url}
          existingScanId={dedupState.existingScanId}
          existingRiskScore={dedupState.existingRiskScore}
          daysSinceScan={dedupState.daysSinceScan}
          onViewExisting={handleViewResult}
          onReinvestigateSuccess={handleDedupReinvestigateSuccess}
        />
      )}
    </>
  );
}
