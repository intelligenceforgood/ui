"use client";

import { useState } from "react";
import { Button, Card } from "@i4g/ui-kit";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface ManageCampaignModalProps {
  campaignId: string;
  initialStatus: string;
  initialName: string;
}

export function ManageCampaignModal({
  campaignId,
  initialStatus,
  initialName,
}: ManageCampaignModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (status !== initialStatus) {
        await fetch(`/api/intelligence/campaigns/${campaignId}/manage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_status", status }),
        });
      }
      if (name !== initialName) {
        await fetch(`/api/intelligence/campaigns/${campaignId}/manage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rename", name }),
        });
      }
      setIsOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Manage Campaign
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 space-y-4 bg-white dark:bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Manage Campaign
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Campaign Name
                </label>
                <input
                  className="w-full mt-1 rounded border border-slate-200 p-2 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  className="w-full mt-1 rounded border border-slate-200 p-2 text-sm dark:border-slate-800 dark:bg-slate-900 text-slate-900 dark:text-white"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
