import * as THREE from "three";
import type { FaceRegion, SimulationResult, TestMode, Vec3 } from "./types";
import { collectAnchorPositionKeys, computeRegionCentroid } from "./regionExtraction";
import { computeDisplacements } from "./deformation";
import { computeStressField } from "./stress";
import { stressToColors } from "./heatmap";

export interface SimulationInput {
  geometry: THREE.BufferGeometry;
  originalPositions: Float32Array;
  regions: FaceRegion[];
  anchorRegionId: number;
  forceRegionId: number;
  forceDelta: Vec3;
  testMode: TestMode;
  youngsModulusGpa: number;
  vertexAdjacency: Map<number, number[]>;
  geometryFactors: Float32Array;
}

export function runSimulation(input: SimulationInput): SimulationResult {
  const {
    originalPositions,
    regions,
    anchorRegionId,
    forceRegionId,
    forceDelta,
    testMode,
    youngsModulusGpa,
    vertexAdjacency,
    geometryFactors,
  } = input;

  const vertexCount = originalPositions.length / 3;
  const anchorRegion = regions[anchorRegionId]!;
  const forceRegion = regions[forceRegionId]!;

  const anchorCentroid = computeRegionCentroid(anchorRegion, originalPositions);
  const forceCentroid = computeRegionCentroid(forceRegion, originalPositions);
  const anchorPositionKeys = collectAnchorPositionKeys(anchorRegion, originalPositions);

  const displacements = computeDisplacements({
    positions: originalPositions,
    vertexCount,
    anchorCentroid,
    forceCentroid,
    anchorPositionKeys,
    forceDelta,
    testMode,
    youngsModulusGpa,
  });

  const stressValues = computeStressField(
    originalPositions,
    displacements,
    vertexCount,
    vertexAdjacency,
    youngsModulusGpa,
    geometryFactors,
  );

  let maxStress = 0;
  let maxDisplacement = 0;
  let dangerCount = 0;

  for (let i = 0; i < vertexCount; i++) {
    if (stressValues[i]! > maxStress) maxStress = stressValues[i]!;
    const dm = Math.sqrt(
      displacements[i * 3]! ** 2 +
        displacements[i * 3 + 1]! ** 2 +
        displacements[i * 3 + 2]! ** 2,
    );
    if (dm > maxDisplacement) maxDisplacement = dm;
  }

  const dangerThreshold = maxStress * 0.7;
  for (let i = 0; i < vertexCount; i++) {
    if (stressValues[i]! >= dangerThreshold) dangerCount++;
  }

  const vertexColors = stressToColors(stressValues, vertexCount, maxStress);
  const dangerPct =
    vertexCount > 0 ? (dangerCount / vertexCount) * 100 : 0;

  return {
    displacements,
    stressValues,
    vertexColors,
    maxStress,
    maxDisplacement,
    dangerPct,
  };
}

export function applyDeformation(
  geometry: THREE.BufferGeometry,
  originalPositions: Float32Array,
  displacements: Float32Array,
): void {
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const count = posAttr.count;

  for (let i = 0; i < count; i++) {
    posAttr.setXYZ(
      i,
      originalPositions[i * 3]! + displacements[i * 3]!,
      originalPositions[i * 3 + 1]! + displacements[i * 3 + 1]!,
      originalPositions[i * 3 + 2]! + displacements[i * 3 + 2]!,
    );
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

export function restoreGeometry(
  geometry: THREE.BufferGeometry,
  originalPositions: Float32Array,
): void {
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const count = posAttr.count;

  for (let i = 0; i < count; i++) {
    posAttr.setXYZ(
      i,
      originalPositions[i * 3]!,
      originalPositions[i * 3 + 1]!,
      originalPositions[i * 3 + 2]!,
    );
  }

  posAttr.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}
