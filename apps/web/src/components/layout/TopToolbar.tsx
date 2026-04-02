import {
  MousePointer2,
  Pin,
  ArrowDownFromLine,
  RotateCcw,
  Maximize2,
  ArrowUpFromLine,
  RefreshCw,
  Crosshair,
  Box,
  Eye,
  Undo2,
  Zap,
  Loader2,
  Save,
  BarChart3,
  FileText,
} from "lucide-react";
import { useCallback } from "react";

import {
  useWorkspaceStore,
  type ToolId,
  type ViewMode,
} from "@/stores/useWorkspaceStore";
import { useModelStore } from "@/stores/useModelStore";
import { useSimulationStore } from "@/stores/useSimulationStore";
import { useMaterialStore, getSelectedMaterial } from "@/stores/useMaterialStore";
import { useAgentStore } from "@/stores/useAgentStore";
import { useScenarioStore } from "@/stores/useScenarioStore";
import { buildAgentInput } from "@/lib/agents/stateAdapter";
import { runAllAgents } from "@/lib/agents/coordinator";
import { compareAllMaterials } from "@/lib/scenarios/comparison";
import { generateReport } from "@/lib/scenarios/report";

interface ToolDef {
  id: ToolId;
  label: string;
  icon: React.ReactNode;
  requiresModel?: boolean;
}

const stressTools: ToolDef[] = [
  { id: "select", label: "Select", icon: <MousePointer2 size={15} /> },
  {
    id: "pin",
    label: "Pin",
    icon: <Pin size={15} />,
    requiresModel: true,
  },
  {
    id: "bend",
    label: "Bend",
    icon: <ArrowDownFromLine size={15} />,
    requiresModel: true,
  },
  {
    id: "twist",
    label: "Twist",
    icon: <RotateCcw size={15} />,
    requiresModel: true,
  },
  {
    id: "compress",
    label: "Compress",
    icon: <Maximize2 size={15} />,
    requiresModel: true,
  },
  {
    id: "tension",
    label: "Tension",
    icon: <ArrowUpFromLine size={15} />,
    requiresModel: true,
  },
];

const viewModeLabels: Record<ViewMode, string> = {
  shaded: "Shaded",
  wireframe: "Wire",
  xray: "X-Ray",
  stress: "Stress",
};

export function TopToolbar() {
  const activeTool = useWorkspaceStore((s) => s.activeTool);
  const setActiveTool = useWorkspaceStore((s) => s.setActiveTool);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const toggleViewMode = useWorkspaceStore((s) => s.toggleViewMode);

  const modelLoaded = useModelStore((s) => s.loaded);
  const loadSample = useModelStore((s) => s.loadSample);
  const requestFitView = useModelStore((s) => s.requestFitView);
  const requestResetCamera = useModelStore((s) => s.requestResetCamera);
  const vertexCount = useModelStore((s) => s.vertexCount);
  const faceCount = useModelStore((s) => s.faceCount);

  const resetSimulation = useSimulationStore((s) => s.resetSimulation);
  const isDeformed = useSimulationStore((s) => s.isDeformed);
  const anchorRegionId = useSimulationStore((s) => s.anchorRegionId);
  const forceRegionId = useSimulationStore((s) => s.forceRegionId);
  const forceDelta = useSimulationStore((s) => s.forceDelta);
  const maxStress = useSimulationStore((s) => s.maxStress);
  const maxDisplacement = useSimulationStore((s) => s.maxDisplacement);
  const dangerPct = useSimulationStore((s) => s.dangerPct);
  const regions = useSimulationStore((s) => s.regions);
  const geometryFactors = useSimulationStore((s) => s.geometryFactors);

  const material = useMaterialStore(getSelectedMaterial);

  const agentIsRunning = useAgentStore((s) => s.isRunning);
  const clearAnalysis = useAgentStore((s) => s.clearAnalysis);
  const setAnalysis = useAgentStore((s) => s.setAnalysis);
  const setRunning = useAgentStore((s) => s.setRunning);

  const openSaveDialog = useScenarioStore((s) => s.openSaveDialog);
  const setComparisonResult = useScenarioStore((s) => s.setComparisonResult);
  const setReport = useScenarioStore((s) => s.setReport);
  const setReportOpen = useScenarioStore((s) => s.setReportOpen);
  const comparisonResult = useScenarioStore((s) => s.comparisonResult);

  const modelName = useModelStore((s) => s.name);

  const hasSimState = isDeformed || anchorRegionId !== null;

  const handleReset = useCallback(() => {
    resetSimulation();
    clearAnalysis();
    setComparisonResult(null);
    setReport(null);
    useWorkspaceStore.getState().setActiveTool("select");
  }, [resetSimulation, clearAnalysis, setComparisonResult, setReport]);

  const buildCurrentInput = useCallback(() => {
    return buildAgentInput({
      material,
      activeTool,
      regions,
      anchorRegionId,
      forceRegionId,
      forceDelta,
      maxStress,
      maxDisplacement,
      dangerPct,
      isDeformed,
      geometryFactors,
      vertexCount,
      faceCount,
    });
  }, [
    material,
    activeTool,
    regions,
    anchorRegionId,
    forceRegionId,
    forceDelta,
    maxStress,
    maxDisplacement,
    dangerPct,
    isDeformed,
    geometryFactors,
    vertexCount,
    faceCount,
  ]);

  const handleCompare = useCallback(() => {
    const input = buildCurrentInput();
    const result = compareAllMaterials(input);
    setComparisonResult(result);
  }, [buildCurrentInput, setComparisonResult]);

  const handleReport = useCallback(() => {
    const analysis = useAgentStore.getState().analysis;
    const report = generateReport({
      modelName: modelName || "Untitled Model",
      materialId: material.id,
      testMode: ["bend", "twist", "compress", "tension"].includes(activeTool)
        ? activeTool
        : null,
      forceDelta: [...forceDelta],
      maxStress,
      maxDisplacement,
      dangerPct,
      analysis,
      comparison: comparisonResult,
    });
    setReport(report);
    setReportOpen(true);
  }, [
    modelName,
    material,
    activeTool,
    forceDelta,
    maxStress,
    maxDisplacement,
    dangerPct,
    comparisonResult,
    setReport,
    setReportOpen,
  ]);

  const handleLoadDemo = useCallback(() => {
    if (!modelLoaded) loadSample();
    useMaterialStore.getState().setSelectedId("pla");
    useWorkspaceStore.getState().setActiveTool("bend");
  }, [modelLoaded, loadSample]);

  const handleAnalyze = useCallback(() => {
    setRunning(true);

    requestAnimationFrame(() => {
      const input = buildAgentInput({
        material,
        activeTool,
        regions,
        anchorRegionId,
        forceRegionId,
        forceDelta,
        maxStress,
        maxDisplacement,
        dangerPct,
        isDeformed,
        geometryFactors,
        vertexCount,
        faceCount,
      });

      const result = runAllAgents(input);
      setAnalysis(result);
    });
  }, [
    material,
    activeTool,
    regions,
    anchorRegionId,
    forceRegionId,
    forceDelta,
    maxStress,
    maxDisplacement,
    dangerPct,
    isDeformed,
    geometryFactors,
    vertexCount,
    faceCount,
    setAnalysis,
    setRunning,
  ]);

  return (
    <header className="flex h-12 items-center border-b border-border bg-surface-1 px-3">
      <div className="mr-5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          SL
        </div>
        <span className="text-sm font-semibold text-zinc-100">StressLab</span>
        <span className="text-2xs font-medium text-zinc-500">AI</span>
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      <nav className="flex items-center gap-0.5 px-1">
        {stressTools.map((tool) => {
          const disabled = tool.requiresModel && !modelLoaded;
          return (
            <button
              key={tool.id}
              title={tool.label}
              onClick={() => !disabled && setActiveTool(tool.id)}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
                activeTool === tool.id
                  ? "bg-accent/20 text-accent"
                  : disabled
                    ? "cursor-not-allowed text-zinc-600"
                    : "text-zinc-400 hover:bg-surface-3 hover:text-zinc-100"
              }`}
            >
              {tool.icon}
              <span className="hidden xl:inline">{tool.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        title="Reset Simulation"
        onClick={handleReset}
        disabled={!hasSimState}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-700"
      >
        <Undo2 size={15} />
        <span className="hidden xl:inline">Reset Sim</span>
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        title="Run AI Analysis"
        onClick={handleAnalyze}
        disabled={!modelLoaded || agentIsRunning}
        className="flex items-center gap-1.5 rounded-md bg-accent/15 px-2.5 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {agentIsRunning ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Zap size={15} />
        )}
        <span>Analyze</span>
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        title="Save Scenario"
        onClick={openSaveDialog}
        disabled={!modelLoaded}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-700"
      >
        <Save size={15} />
        <span className="hidden xl:inline">Save</span>
      </button>

      <button
        title="Compare Materials"
        onClick={handleCompare}
        disabled={!modelLoaded}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-700"
      >
        <BarChart3 size={15} />
        <span className="hidden xl:inline">Compare</span>
      </button>

      <button
        title="Generate Report"
        onClick={handleReport}
        disabled={!modelLoaded}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-700"
      >
        <FileText size={15} />
        <span className="hidden xl:inline">Report</span>
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <div className="flex items-center gap-0.5 px-1">
        <button
          title="Fit View"
          onClick={requestFitView}
          disabled={!modelLoaded}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-700"
        >
          <Crosshair size={15} />
          <span className="hidden xl:inline">Fit</span>
        </button>
        <button
          title="Reset Camera"
          onClick={requestResetCamera}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100"
        >
          <RefreshCw size={15} />
          <span className="hidden xl:inline">Reset Cam</span>
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        title="Toggle view mode"
        onClick={toggleViewMode}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100"
      >
        <Eye size={15} />
        <span className="text-2xs font-mono">{viewModeLabels[viewMode]}</span>
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      <button
        title="Load sample model"
        onClick={loadSample}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-surface-3 hover:text-zinc-100"
      >
        <Box size={15} />
        <span className="hidden xl:inline">Load Sample</span>
      </button>

      {!modelLoaded && (
        <>
          <div className="mx-1 h-5 w-px bg-border" />
          <button
            title="Quick demo: load model + PLA + Bend tool"
            onClick={handleLoadDemo}
            className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25"
          >
            <Zap size={15} />
            <span>Quick Demo</span>
          </button>
        </>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-2xs text-zinc-500">
        {modelLoaded && (
          <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-accent">
            {modelName || "Model loaded"}
          </span>
        )}
        {isDeformed && (
          <span className="rounded bg-warning/10 px-1.5 py-0.5 font-mono text-warning">
            Simulation active
          </span>
        )}
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-emerald-400">
          Demo Ready
        </span>
      </div>
    </header>
  );
}
