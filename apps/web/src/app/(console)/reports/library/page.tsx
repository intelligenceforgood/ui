import type { Metadata } from "next";
import { Badge, FeedbackButton } from "@i4g/ui-kit";
import { getI4GClient } from "@/lib/i4g-client";
import type { ReportLibraryItem } from "@i4g/sdk";
import { FileText, Download } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Report Library",
  description: "Browse and download generated reports.",
};

export const dynamic = "force-dynamic";

const tlpColor: Record<string, "default" | "success" | "danger"> = {
  "TLP:GREEN": "success",
  "TLP:AMBER": "default",
  "TLP:RED": "danger",
};

export default async function ReportLibraryPage() {
  const client = await getI4GClient();
  const { items: reports, count } = await client.listReports({ limit: 50 });

  return (
    <div className="group relative space-y-6">
      <FeedbackButton
        feedbackId="reports.library"
        className="absolute top-1 right-0 z-10"
      />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Reports
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Report Library
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {count} report{count !== 1 ? "s" : ""} generated
          </p>
        </div>
        <Link
          href="/reports/builder"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" />
          Generate Report
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Template
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Scope
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                TLP
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report: ReportLibraryItem) => (
              <tr key={report.reportId} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  {report.template.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {report.scope}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={tlpColor[report.tlp] ?? "default"}>
                    {report.tlp}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      report.status === "complete" ? "success" : "default"
                    }
                  >
                    {report.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {report.status === "complete" && (
                    <a
                      href={`/api/reports/${report.reportId}/download`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {reports.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  No reports generated yet. Use the Report Builder to create
                  one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
