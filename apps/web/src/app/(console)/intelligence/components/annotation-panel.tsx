"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@i4g/ui-kit";
import type { Annotation } from "@i4g/sdk";
import { MessageSquarePlus, Trash2 } from "lucide-react";

interface AnnotationPanelProps {
  targetType: string;
  targetId: string;
}

export function AnnotationPanel({
  targetType,
  targetId,
}: AnnotationPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnotations = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        target_type: targetType,
        target_id: targetId,
      });
      const res = await fetch(`/api/intelligence/annotations?${query}`);
      if (res.ok) setAnnotations(await res.json());
    } catch {
      // Silently fail — annotations are non-critical
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  const handleCreate = useCallback(async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/intelligence/annotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, content: newContent }),
      });
      if (res.ok) {
        setNewContent("");
        fetchAnnotations();
      }
    } finally {
      setSubmitting(false);
    }
  }, [newContent, targetType, targetId, fetchAnnotations]);

  const handleDelete = useCallback(
    async (annotationId: string) => {
      await fetch(`/api/intelligence/annotations/${annotationId}`, {
        method: "DELETE",
      });
      fetchAnnotations();
    },
    [fetchAnnotations],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <MessageSquarePlus className="h-4 w-4" />
        Annotations
      </div>

      {loading ? (
        <div className="h-16 animate-pulse rounded bg-slate-100" />
      ) : annotations.length === 0 ? (
        <p className="text-xs text-slate-400">No annotations yet</p>
      ) : (
        <div className="max-h-48 space-y-1.5 overflow-y-auto">
          {annotations.map((a) => (
            <Card
              key={a.annotationId}
              className="flex items-start justify-between p-2"
            >
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {a.content}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {a.author} ·{" "}
                  {a.createdAt
                    ? new Date(a.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.annotationId)}
                className="text-slate-300 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-1">
        <input
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add annotation…"
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={submitting || !newContent.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
