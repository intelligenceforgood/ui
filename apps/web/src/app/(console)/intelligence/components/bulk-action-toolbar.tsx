"use client";

import { useState } from "react";
import { Button } from "@i4g/ui-kit";
import { CheckSquare, Download, Flag, Tag, X } from "lucide-react";

interface BulkActionToolbarProps {
  selectedIds: string[];
  onClear: () => void;
  onAction: (action: string, options?: { status?: string }) => Promise<void>;
}

export function BulkActionToolbar({
  selectedIds,
  onClear,
  onAction,
}: BulkActionToolbarProps) {
  const [busy, setBusy] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleAction = async (
    action: string,
    options?: { status?: string },
  ) => {
    setBusy(true);
    try {
      await onAction(action, options);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-800 dark:bg-blue-900/20">
      <CheckSquare className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {selectedIds.length} selected
      </span>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => handleAction("export")}
        >
          <Download className="mr-1 h-3 w-3" /> Export
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => handleAction("status_update", { status: "flagged" })}
        >
          <Flag className="mr-1 h-3 w-3" /> Flag
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => handleAction("tag")}
        >
          <Tag className="mr-1 h-3 w-3" /> Tag
        </Button>
      </div>
      <button onClick={onClear} className="ml-auto">
        <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
      </button>
    </div>
  );
}
