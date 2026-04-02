import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useModelStore } from "@/stores/useModelStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useSimulationStore } from "@/stores/useSimulationStore";
import { ModelMesh } from "./ModelMesh";
import { ForceHandle } from "./ForceHandle";
import { PinMarker } from "./PinMarker";
import { SceneLighting, SceneGrid } from "./SceneHelpers";
import type { Vec3 } from "@/lib/simulation/types";
import { computeRegionCentroid } from "@/lib/simulation/regionExtraction";

function CameraController() {
  const shouldFitView = useModelStore((s) => s.shouldFitView);
  const shouldResetCamera = useModelStore((s) => s.shouldResetCamera);
  const center = useModelStore((s) => s.center);
  const radius = useModelStore((s) => s.radius);
  const consumeFitView = useModelStore((s) => s.consumeFitView);
  const consumeResetCamera = useModelStore((s) => s.consumeResetCamera);

  const { camera, invalidate } = useThree();
  const controls = useThree((s) => s.controls) as unknown as {
    target: { set: (x: number, y: number, z: number) => void };
    update: () => void;
  } | null;

  useEffect(() => {
    if (!shouldFitView || !center || !radius || !controls) return;
    const dist = Math.max(radius * 2.5, 20);
    camera.position.set(
      center[0] + dist * 0.7,
      center[1] + dist * 0.5,
      center[2] + dist * 0.7,
    );
    camera.lookAt(center[0], center[1], center[2]);
    controls.target.set(center[0], center[1], center[2]);
    controls.update();
    invalidate();
    consumeFitView();
  }, [
    shouldFitView,
    center,
    radius,
    camera,
    controls,
    invalidate,
    consumeFitView,
  ]);

  useEffect(() => {
    if (!shouldResetCamera || !controls) return;
    camera.position.set(50, 35, 50);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
    invalidate();
    consumeResetCamera();
  }, [shouldResetCamera, camera, controls, invalidate, consumeResetCamera]);

  return null;
}

function DynamicOrbitControls() {
  const activeTool = useWorkspaceStore((s) => s.activeTool);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const isToolMode = activeTool !== "select";

  useEffect(() => {
    if (!controlsRef.current) return;
    if (isToolMode) {
      controlsRef.current.mouseButtons = {
        LEFT: -1 as THREE.MOUSE,
        MIDDLE: THREE.MOUSE.ROTATE,
        RIGHT: THREE.MOUSE.PAN,
      };
    } else {
      controlsRef.current.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      };
    }
  }, [isToolMode]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={500}
    />
  );
}

function SimulationOverlays() {
  const regions = useSimulationStore((s) => s.regions);
  const anchorRegionId = useSimulationStore((s) => s.anchorRegionId);
  const forceRegionId = useSimulationStore((s) => s.forceRegionId);
  const originalPositions = useSimulationStore((s) => s.originalPositions);
  const updateForceDelta = useSimulationStore((s) => s.updateForceDelta);

  const onDrag = useCallback(
    (delta: Vec3) => {
      updateForceDelta(delta);
    },
    [updateForceDelta],
  );

  if (!originalPositions || regions.length === 0) return null;

  const anchorPos =
    anchorRegionId !== null
      ? computeRegionCentroid(regions[anchorRegionId]!, originalPositions)
      : null;
  const forcePos =
    forceRegionId !== null
      ? computeRegionCentroid(regions[forceRegionId]!, originalPositions)
      : null;

  return (
    <>
      {anchorPos && <PinMarker position={anchorPos} />}
      {forcePos && <ForceHandle position={forcePos} onDrag={onDrag} />}
    </>
  );
}

export function SceneCanvas() {
  return (
    <Canvas
      camera={{ position: [50, 35, 50], fov: 45, near: 0.1, far: 10000 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
      style={{ background: "#09090b" }}
    >
      <SceneLighting />
      <SceneGrid />
      <ModelMesh />
      <SimulationOverlays />
      <DynamicOrbitControls />
      <CameraController />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport
          axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
          labelColor="white"
        />
      </GizmoHelper>
    </Canvas>
  );
}
