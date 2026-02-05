import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getI4GClient } from "@/lib/i4g-client";
import { Badge, Button, Card } from "@i4g/ui-kit";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Paperclip,
  Share2,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

// Force dynamic since we are fetching a specific ID
export const dynamic = "force-dynamic";

async function CaseDetailView({ id }: { id: string }) {
  const client = getI4GClient();
  const caseData = await client.getCase(id);

  if (!caseData) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/cases"
              className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Cases
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {caseData.title}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" />
              {caseData.id}
            </span>
            <span>•</span>
            <span className="capitalize">Priority: {caseData.priority}</span>
            <span>•</span>
            <span className="capitalize">Status: {caseData.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button>Close Case</Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column: Context & Timeline */}
        <div className="col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Case Narrative</h3>
            <p className="text-slate-600 leading-relaxed">
              {caseData.description || "No description provided."}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Timeline
            </h3>
            <div className="space-y-4">
              {caseData.timeline.length === 0 && (
                <p className="text-sm text-slate-500 italic">
                  No events recorded.
                </p>
              )}
              {caseData.timeline.map((evt) => (
                <div
                  key={evt.id}
                  className="flex gap-3 pb-4 border-b border-slate-100 last:border-0"
                >
                  <div className="text-xs text-slate-400 w-24 pt-1">
                    {new Date(evt.timestamp).toLocaleDateString()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {evt.description}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {evt.type} • {evt.actor || "System"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Artifacts & Metadata */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-slate-400" />
              Artifacts ({caseData.artifacts.length})
            </h3>
            <ul className="space-y-3">
              {caseData.artifacts.map((art) => (
                <li
                  key={art.id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm transition-colors hover:bg-slate-100"
                >
                  {art.url ? (
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[180px]"
                    >
                      {art.name}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="truncate max-w-[180px] text-slate-700">
                      {art.name}
                    </span>
                  )}
                  <Badge variant="default" className="text-xs">
                    {art.type}
                  </Badge>
                </li>
              ))}
              {caseData.artifacts.length === 0 && (
                <li className="text-sm text-slate-500 italic">
                  No artifacts attached
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div>Loading workspace...</div>}>
      <CaseDetailView id={id} />
    </Suspense>
  );
}
