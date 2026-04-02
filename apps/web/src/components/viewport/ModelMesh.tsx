import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";

import { useModelStore } from "@/stores/useModelStore";
import {
  useMaterialStore,
  getSelectedMaterial,
} from "@/stores/useMaterialStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useSimulationStore } from "@/stores/useSimulationStore";
import { createSampleBracket } from "@/lib/three/sampleGeometry";
import { isTestMode } from "@/lib/simulation/types";
import {
  runSimulation,
  applyDeformation,
  restoreGeometry,
} from "@/lib/simulation/engine";
import { applyVertexColors } from "@/lib/simulation/heatmap";

function hexToRgb(hex: string): [number, number, number] {
  const c = parseInt(hex.replace("#", ""), 16);
  return [(c >> 16) / 255, ((c >> 8) & 0xff) / 255, (c & 0xff) / 255];
}

export function ModelMesh() {
  const source = useModelStore((s) => s.source);
  const setGeometryMeta = useModelStore((s) => s.setGeometryMeta);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const activeTool = useWorkspaceStore((s) => s.activeTool);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const material = useMaterialStore(getSelectedMaterial);

  const faceToRegion = useSimulationStore((s) => s.faceToRegion);
  const hoveredRegionId = useSimulationStore((s) => s.hoveredRegionId);
  const anchorRegionId = useSimulationStore((s) => s.anchorRegionId);
  const forceRegionId = useSimulationStore((s) => s.forceRegionId);
  const regionVertexMap = useSimulationStore((s) => s.regionVertexMap);
  const initFromGeometry = useSimulationStore((s) => s.initFromGeometry);
  const setHoveredRegion = useSimulationStore((s) => s.setHoveredRegion);
  const setAnchorRegion = useSimulationStore((s) => s.setAnchorRegion);
  const setForceRegion = useSimulationStore((s) => s.setForceRegion);
  const setResults = useSimulationStore((s) => s.setResults);
  const setIsDeformed = useSimulationStore((s) => s.setIsDeformed);

  const meshRef = useRef<THREE.Mesh>(null);
  const colorBuf = useRef<Float32Array | null>(null);
  const lastForceDelta = useRef<string>("");
  const lastMaterialId = useRef<string>("");
  const lastToolRef = useRef<string>("");
  const autoSwitched = useRef(false);

  const geometry = useMemo(() => {
    if (source === "sample-bracket") return createSampleBracket();
    return null;
  }, [source]);

  useEffect(() => {
    if (!geometry) return;
    geometry.computeBoundingSphere();
    const bs = geometry.boundingSphere;
    if (!bs) return;

    const posAttr = geometry.getAttribute("position");
    const indexAttr = geometry.getIndex();
    const vc = posAttr ? posAttr.count : 0;
    const fc = indexAttr ? indexAttr.count / 3 : vc / 3;

    setGeometryMeta({
      vertexCount: vc,
      faceCount: Math.floor(fc),
      center: [bs.center.x, bs.center.y, bs.center.z],
      radius: bs.radius,
    });

    initFromGeometry(geometry);
    autoSwitched.current = false;
  }, [geometry, setGeometryMeta, initFromGeometry]);

  const isToolMode = activeTool !== "select";

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!isToolMode || !faceToRegion) return;
      e.stopPropagation();
      const fi = e.faceIndex;
      if (fi == null) return;
      const rid = faceToRegion[fi]!;
      if (rid >= 0 && rid !== hoveredRegionId) {
        setHoveredRegion(rid);
      }
    },
    [isToolMode, faceToRegion, hoveredRegionId, setHoveredRegion],
  );

  const onClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isToolMode || !faceToRegion) return;
      e.stopPropagation();
      const fi = e.faceIndex;
      if (fi == null) return;
      const rid = faceToRegion[fi]!;
      if (rid < 0) return;

      if (activeTool === "pin") {
        setAnchorRegion(rid);
      } else if (isTestMode(activeTool)) {
        setForceRegion(rid);
      }
    },
    [isToolMode, activeTool, faceToRegion, setAnchorRegion, setForceRegion],
  );

  const onPointerOut = useCallback(() => {
    if (isToolMode) setHoveredRegion(null);
  }, [isToolMode, setHoveredRegion]);

  useFrame(() => {
    if (!geometry) return;

    const simStore = useSimulationStore.getState();
    const {
      originalPositions,
      anchorRegionId: anchor,
      forceRegionId: force,
      forceDelta,
      vertexAdjacency,
      geometryFactors,
      regions: simRegions,
    } = simStore;

    if (!originalPositions) return;

    const tool = useWorkspaceStore.getState().activeTool;
    const mat = useMaterialStore.getState();
    const selectedMat = getSelectedMaterial(mat);
    const currentView = useWorkspaceStore.getState().viewMode;

    const forceKey = `${forceDelta[0].toFixed(4)},${forceDelta[1].toFixed(4)},${forceDelta[2].toFixed(4)}`;
    const needsRecompute =
      forceKey !== lastForceDelta.current ||
      selectedMat.id !== lastMaterialId.current ||
      tool !== lastToolRef.current;

    const hasForce =
      anchor !== null &&
      force !== null &&
      isTestMode(tool) &&
      (forceDelta[0] !== 0 || forceDelta[1] !== 0 || forceDelta[2] !== 0);

    if (hasForce && needsRecompute && vertexAdjacency && geometryFactors) {
      const result = runSimulation({
        geometry,
        originalPositions,
        regions: simRegions,
        anchorRegionId: anchor!,
        forceRegionId: force!,
        forceDelta,
        testMode: tool as "bend" | "twist" | "compress" | "tension",
        youngsModulusGpa: selectedMat.youngs_modulus_gpa,
        vertexAdjacency,
        geometryFactors,
      });

      applyDeformation(geometry, originalPositions, result.displacements);
      setIsDeformed(true);

      if (!autoSwitched.current) {
        setViewMode("stress");
        autoSwitched.current = true;
      }

      const vertexCount = originalPositions.length / 3;
      if (!colorBuf.current || colorBuf.current.length !== vertexCount * 3) {
        colorBuf.current = new Float32Array(vertexCount * 3);
      }

      const showHeatmap = currentView === "stress";
      applyVertexColors(
        colorBuf.current,
        vertexCount,
        hexToRgb(selectedMat.color_hex),
        {
          hoveredRegionId: simStore.hoveredRegionId,
          anchorRegionId: anchor,
          forceRegionId: force,
        },
        simStore.regionVertexMap,
        showHeatmap ? result.vertexColors : null,
      );

      let colorAttr = geometry.getAttribute(
        "color",
      ) as THREE.BufferAttribute | null;
      if (!colorAttr || colorAttr.count !== vertexCount) {
        colorAttr = new THREE.Float32BufferAttribute(colorBuf.current, 3);
        geometry.setAttribute("color", colorAttr);
      } else {
        (colorAttr.array as Float32Array).set(colorBuf.current);
      }
      colorAttr.needsUpdate = true;

      setResults({
        maxStress: result.maxStress,
        maxDisplacement: result.maxDisplacement,
        dangerPct: result.dangerPct,
      });

      lastForceDelta.current = forceKey;
      lastMaterialId.current = selectedMat.id;
      lastToolRef.current = tool;
    } else if (!hasForce && simStore.isDeformed) {
      restoreGeometry(geometry, originalPositions);
      setIsDeformed(false);
      lastForceDelta.current = "";
    }
  });

  useEffect(() => {
    if (!geometry) return;

    const simStore = useSimulationStore.getState();
    const { originalPositions } = simStore;
    if (!originalPositions) return;

    const vertexCount = originalPositions.length / 3;
    const hasHighlights =
      hoveredRegionId !== null ||
      anchorRegionId !== null ||
      forceRegionId !== null;

    if (!hasHighlights && !useSimulationStore.getState().isDeformed) {
      geometry.deleteAttribute("color");
      return;
    }

    if (!colorBuf.current || colorBuf.current.length !== vertexCount * 3) {
      colorBuf.current = new Float32Array(vertexCount * 3);
    }

    const base = hexToRgb(material.color_hex);
    applyVertexColors(
      colorBuf.current,
      vertexCount,
      base,
      { hoveredRegionId, anchorRegionId, forceRegionId },
      regionVertexMap,
      null,
    );

    let colorAttr = geometry.getAttribute(
      "color",
    ) as THREE.BufferAttribute | null;
    if (!colorAttr || colorAttr.count !== vertexCount) {
      colorAttr = new THREE.Float32BufferAttribute(colorBuf.current, 3);
      geometry.setAttribute("color", colorAttr);
    } else {
      (colorAttr.array as Float32Array).set(colorBuf.current);
    }
    colorAttr.needsUpdate = true;
  }, [
    geometry,
    hoveredRegionId,
    anchorRegionId,
    forceRegionId,
    regionVertexMap,
    material.color_hex,
  ]);

  if (!geometry) return null;

  const hasHighlights =
    hoveredRegionId !== null ||
    anchorRegionId !== null ||
    forceRegionId !== null;
  const isStressView = viewMode === "stress";
  const hasVColors =
    hasHighlights || (isStressView && useSimulationStore.getState().isDeformed);
  const isWireframe = viewMode === "wireframe";
  const isXray = viewMode === "xray";

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onPointerMove={onPointerMove}
        onClick={onClick}
        onPointerOut={onPointerOut}
      >
        <meshStandardMaterial
          color={hasVColors ? "#ffffff" : material.color_hex}
          vertexColors={hasVColors}
          roughness={0.55}
          metalness={0.15}
          wireframe={isWireframe}
          transparent={isXray}
          opacity={isXray ? 0.35 : 1}
          side={isXray ? THREE.DoubleSide : THREE.FrontSide}
        />
      </mesh>
      {!isWireframe && !isXray && !isStressView && (
        <lineSegments>
          <edgesGeometry args={[geometry, 30]} />
          <lineBasicMaterial color="#ffffff" opacity={0.04} transparent />
        </lineSegments>
      )}
    </group>
  );
}
