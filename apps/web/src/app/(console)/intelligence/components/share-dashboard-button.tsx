"use client";

import { Share } from "lucide-react";
import { useState } from "react";
import { Button } from "@i4g/ui-kit";

export function ShareDashboardButton() {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/intelligence/charts/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chart_type: "dashboard_summary",
          chart_config: {},
        }),
      });
      if (!res.ok) throw new Error("Failed to share");
      const data = await res.json();

      // In a real app we might construct the full URL if we plan to show the embed outside the app,
      // but for this task the requirement is: display `/api/intelligence/charts/{token_id}/embed` link.
      // Assuming it's a relative URL or an absolute URL based on the API response.
      const url = `${window.location.origin}${data.embed_url}`;
      await navigator.clipboard.writeText(url);
      alert(`Embed link copied to clipboard:\n${url}`);
    } catch (err) {
      console.error(err);
      alert("Error generating share link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={loading}
      variant="secondary"
      size="sm"
      className="flex items-center gap-2"
    >
      <Share className="h-4 w-4" />
      {loading ? "Generating..." : "Share"}
    </Button>
  );
}
