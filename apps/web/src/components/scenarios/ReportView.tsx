import { useState } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  X,
  AlertTriangle,
  Shield,
  Lightbulb,
  ClipboardCheck,
} from "lucide-react";

import { useScenarioStore } from "@/stores/useScenarioStore";
import { reportToJson, reportToMarkdown } from "@/lib/scenarios/report";
import type { StressReport } from "@/lib/scenarios/types";

function riskColor(risk: number): string {
  if (risk >= 60) return "text-red-400";
  if (risk >= 35) return "text-yellow-400";
  return "text-emerald-400";
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportContent({ report }: { report: StressReport }) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(reportToJson(report));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    downloadFile(
      reportToJson(report),
      `stresslab-report-${report.id}.json`,
      "application/json",
    );
  };

  const handleExportMarkdown = () => {
    downloadFile(
      reportToMarkdown(report),
      `stresslab-report-${report.id}.md`,
      "text/markdown",
    );
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
            h2 { margin-top: 1.5rem; color: #444; }
            pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; white-space: pre-wrap; }
            .risk { font-size: 2rem; font-weight: bold; }
            .risk.high { color: #dc2626; }
            .risk.moderate { color: #ca8a04; }
            .risk.low { color: #16a34a; }
            ul { padding-left: 1.5rem; }
            li { margin: 0.25rem 0; }
            .meta { color: #666; font-size: 0.875rem; }
            .note { background: #fffbeb; border: 1px solid #f59e0b; padding: 0.75rem; border-radius: 4px; margin-top: 2rem; font-size: 0.875rem; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${report.title}</h1>
          <p class="meta">Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
          <div class="risk ${report.overallRisk >= 60 ? "high" : report.overallRisk >= 35 ? "moderate" : "low"}">${report.overallRisk}/100</div>
          <p>${report.riskAssessment}</p>
          <h2>Test Configuration</h2>
          <ul>
            <li><strong>Model:</strong> ${report.modelName}</li>
            <li><strong>Material:</strong> ${report.materialName}</li>
            <li><strong>Test:</strong> ${report.testType ?? "None"}</li>
            <li><strong>Force:</strong> ${report.forceSummary}</li>
          </ul>
          ${report.likelyFailureMode ? `<h2>Likely Failure Mode</h2><p>${report.likelyFailureMode}</p>` : ""}
          <h2>Danger Zones</h2>
          <ul>${report.dangerZones.map((z) => `<li>${z}</li>`).join("")}</ul>
          <h2>Design Recommendations</h2>
          <ul>${report.designRecommendations.map((r) => `<li>${r}</li>`).join("")}</ul>
          ${
            report.comparisonSummary
              ? `<h2>Material Comparison</h2>
                 <table style="width:100%;border-collapse:collapse">
                   <tr style="border-bottom:1px solid #ddd"><th style="text-align:left;padding:4px">Material</th><th>Risk</th><th>Safety Factor</th><th>Failure Mode</th></tr>
                   ${report.comparisonSummary.map((e) => `<tr style="border-bottom:1px solid #eee"><td style="padding:4px">${e.materialName}</td><td style="text-align:center">${e.riskScore}</td><td style="text-align:center">${e.safetyFactor.toFixed(1)}x</td><td>${e.failureMode ?? "—"}</td></tr>`).join("")}
                 </table>`
              : ""
          }
          <div class="note">${report.confidenceNote}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportJson}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-2xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-200"
        >
          <Download size={12} />
          JSON
        </button>
        <button
          onClick={handleExportMarkdown}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-2xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-200"
        >
          <Download size={12} />
          Markdown
        </button>
        <button
          onClick={handleCopyJson}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-2xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-200"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy JSON"}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-2xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-200"
        >
          <FileText size={12} />
          Print
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface-2 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-200">{report.title}</h3>
          <span className="text-2xs text-zinc-500">
            {new Date(report.generatedAt).toLocaleString()}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div
            className={`text-2xl font-bold tabular-nums ${riskColor(report.overallRisk)}`}
          >
            {report.overallRisk}
            <span className="text-xs font-normal text-zinc-500">/100</span>
          </div>
          <p className="text-xs text-zinc-400">{report.riskAssessment}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InfoCard label="Model" value={report.modelName} />
        <InfoCard label="Material" value={report.materialName} />
        <InfoCard label="Test" value={report.testType ?? "None"} />
        <InfoCard label="Force" value={report.forceSummary} />
      </div>

      {report.likelyFailureMode && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 p-2.5">
          <AlertTriangle size={14} className="text-orange-400" />
          <div>
            <p className="text-2xs font-medium text-zinc-400">
              Likely Failure Mode
            </p>
            <p className="text-xs text-orange-300">
              {report.likelyFailureMode}
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <Shield size={12} className="text-zinc-500" />
          <p className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
            Danger Zones
          </p>
        </div>
        <div className="space-y-1">
          {report.dangerZones.map((zone, i) => (
            <p key={i} className="text-2xs text-zinc-400">
              • {zone}
            </p>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <Lightbulb size={12} className="text-zinc-500" />
          <p className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
            Design Recommendations
          </p>
        </div>
        <div className="space-y-1">
          {report.designRecommendations.map((rec, i) => (
            <p key={i} className="text-2xs text-zinc-400">
              • {rec}
            </p>
          ))}
        </div>
      </div>

      {report.comparisonSummary && report.comparisonSummary.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <ClipboardCheck size={12} className="text-zinc-500" />
            <p className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
              Material Comparison Summary
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-2">
            <div className="grid grid-cols-4 border-b border-border px-2 py-1 text-2xs font-medium text-zinc-500">
              <div>Material</div>
              <div className="text-center">Risk</div>
              <div className="text-center">Safety</div>
              <div>Failure Mode</div>
            </div>
            {report.comparisonSummary.map((entry) => (
              <div
                key={entry.materialId}
                className="grid grid-cols-4 border-b border-border/50 px-2 py-1.5 text-2xs last:border-0"
              >
                <div className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.colorHex }}
                  />
                  <span className="text-zinc-300">{entry.materialName}</span>
                </div>
                <div className={`text-center font-medium ${riskColor(entry.riskScore)}`}>
                  {entry.riskScore}
                </div>
                <div className="text-center text-zinc-300">
                  {entry.safetyFactor.toFixed(1)}x
                </div>
                <div className="text-zinc-500">
                  {entry.failureMode ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2.5">
        <p className="text-2xs italic text-yellow-400/70">
          {report.confidenceNote}
        </p>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-2">
      <p className="text-2xs text-zinc-500">{label}</p>
      <p className="text-xs font-medium text-zinc-300">{value}</p>
    </div>
  );
}

export function ReportPanel() {
  const report = useScenarioStore((s) => s.report);
  const setReport = useScenarioStore((s) => s.setReport);

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText size={24} className="mb-2 text-zinc-600" />
        <p className="text-xs text-zinc-500">No report generated</p>
        <p className="mt-1 text-2xs text-zinc-600">
          Click "Report" in the toolbar to generate
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileText size={14} className="text-accent" />
          <span className="text-xs font-medium text-zinc-200">
            Stress Report
          </span>
        </div>
        <button
          onClick={() => setReport(null)}
          className="rounded p-0.5 text-zinc-500 hover:text-zinc-300"
        >
          <X size={12} />
        </button>
      </div>
      <ReportContent report={report} />
    </div>
  );
}
