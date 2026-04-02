import * as THREE from "three";
import type { FaceRegion, Vec3 } from "./types";
import { positionKey } from "./types";

const NORMAL_ANGLE_THRESHOLD_DEG = 15;

interface FaceData {
  normal: THREE.Vector3;
  centroid: THREE.Vector3;
}

function getVertexIndex(
  indexAttr: THREE.BufferAttribute | null,
  face: number,
  corner: number,
): number {
  if (indexAttr) return indexAttr.getX(face * 3 + corner);
  return face * 3 + corner;
}

function computeFaceData(
  posAttr: THREE.BufferAttribute,
  indexAttr: THREE.BufferAttribute | null,
  faceCount: number,
): FaceData[] {
  const faces: FaceData[] = [];
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  for (let f = 0; f < faceCount; f++) {
    const i0 = getVertexIndex(indexAttr, f, 0);
    const i1 = getVertexIndex(indexAttr, f, 1);
    const i2 = getVertexIndex(indexAttr, f, 2);

    v0.fromBufferAttribute(posAttr, i0);
    v1.fromBufferAttribute(posAttr, i1);
    v2.fromBufferAttribute(posAttr, i2);

    const edge1 = v1.clone().sub(v0);
    const edge2 = v2.clone().sub(v0);
    const normal = edge1.cross(edge2).normalize();
    const centroid = v0.clone().add(v1).add(v2).divideScalar(3);

    faces.push({ normal, centroid });
  }

  return faces;
}

function buildEdgeAdjacency(
  posAttr: THREE.BufferAttribute,
  indexAttr: THREE.BufferAttribute | null,
  faceCount: number,
): Map<string, number[]> {
  const edgeToFaces = new Map<string, number[]>();
  const v = new THREE.Vector3();

  for (let f = 0; f < faceCount; f++) {
    const keys: string[] = [];
    for (let c = 0; c < 3; c++) {
      const vi = getVertexIndex(indexAttr, f, c);
      v.fromBufferAttribute(posAttr, vi);
      keys.push(positionKey(v.x, v.y, v.z));
    }

    for (let c = 0; c < 3; c++) {
      const a = keys[c]!;
      const b = keys[(c + 1) % 3]!;
      const edgeKey = a < b ? `${a}|${b}` : `${b}|${a}`;
      let list = edgeToFaces.get(edgeKey);
      if (!list) {
        list = [];
        edgeToFaces.set(edgeKey, list);
      }
      list.push(f);
    }
  }

  return edgeToFaces;
}

function buildFaceAdjacency(
  edgeToFaces: Map<string, number[]>,
  faceCount: number,
): number[][] {
  const adj: number[][] = Array.from({ length: faceCount }, () => []);

  for (const faces of edgeToFaces.values()) {
    for (let i = 0; i < faces.length; i++) {
      for (let j = i + 1; j < faces.length; j++) {
        adj[faces[i]!]!.push(faces[j]!);
        adj[faces[j]!]!.push(faces[i]!);
      }
    }
  }

  return adj;
}

export function extractRegions(
  geometry: THREE.BufferGeometry,
  angleThreshold = NORMAL_ANGLE_THRESHOLD_DEG,
): FaceRegion[] {
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const indexAttr = geometry.getIndex();
  const faceCount = indexAttr
    ? indexAttr.count / 3
    : posAttr.count / 3;

  const faceData = computeFaceData(posAttr, indexAttr, faceCount);
  const edgeToFaces = buildEdgeAdjacency(posAttr, indexAttr, faceCount);
  const faceAdj = buildFaceAdjacency(edgeToFaces, faceCount);

  const cosThreshold = Math.cos((angleThreshold * Math.PI) / 180);
  const visited = new Uint8Array(faceCount);
  const regions: FaceRegion[] = [];

  for (let seed = 0; seed < faceCount; seed++) {
    if (visited[seed]) continue;

    const seedNormal = faceData[seed]!.normal;
    const cluster: number[] = [];
    const queue = [seed];
    visited[seed] = 1;

    while (queue.length > 0) {
      const face = queue.shift()!;
      cluster.push(face);

      for (const neighbor of faceAdj[face]!) {
        if (visited[neighbor]) continue;
        if (faceData[neighbor]!.normal.dot(seedNormal) >= cosThreshold) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
    }

    const vertexSet = new Set<number>();
    for (const f of cluster) {
      for (let c = 0; c < 3; c++) {
        vertexSet.add(getVertexIndex(indexAttr, f, c));
      }
    }

    const avgNormal = new THREE.Vector3();
    const avgCentroid = new THREE.Vector3();
    for (const f of cluster) {
      avgNormal.add(faceData[f]!.normal);
      avgCentroid.add(faceData[f]!.centroid);
    }
    avgNormal.divideScalar(cluster.length).normalize();
    avgCentroid.divideScalar(cluster.length);

    regions.push({
      id: regions.length,
      faceIndices: cluster,
      vertexIndices: Array.from(vertexSet),
      normal: [avgNormal.x, avgNormal.y, avgNormal.z],
      centroid: [avgCentroid.x, avgCentroid.y, avgCentroid.z],
    });
  }

  return regions;
}

export function buildFaceToRegionMap(
  regions: FaceRegion[],
  faceCount: number,
): Int32Array {
  const map = new Int32Array(faceCount).fill(-1);
  for (const region of regions) {
    for (const fi of region.faceIndices) {
      map[fi] = region.id;
    }
  }
  return map;
}

export function buildVertexAdjacency(
  geometry: THREE.BufferGeometry,
): Map<number, number[]> {
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const indexAttr = geometry.getIndex();
  const faceCount = indexAttr
    ? indexAttr.count / 3
    : posAttr.count / 3;

  const adj = new Map<number, Set<number>>();

  for (let f = 0; f < faceCount; f++) {
    const indices = [0, 1, 2].map((c) => getVertexIndex(indexAttr, f, c));
    for (let c = 0; c < 3; c++) {
      const a = indices[c]!;
      const b = indices[(c + 1) % 3]!;
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    }
  }

  const result = new Map<number, number[]>();
  for (const [k, v] of adj) {
    result.set(k, Array.from(v));
  }
  return result;
}

export function collectAnchorPositionKeys(
  region: FaceRegion,
  positions: Float32Array,
): Set<string> {
  const keys = new Set<string>();
  for (const vi of region.vertexIndices) {
    keys.add(
      positionKey(
        positions[vi * 3]!,
        positions[vi * 3 + 1]!,
        positions[vi * 3 + 2]!,
      ),
    );
  }
  return keys;
}

export function computeRegionCentroid(
  region: FaceRegion,
  positions: Float32Array,
): Vec3 {
  let cx = 0, cy = 0, cz = 0;
  for (const vi of region.vertexIndices) {
    cx += positions[vi * 3]!;
    cy += positions[vi * 3 + 1]!;
    cz += positions[vi * 3 + 2]!;
  }
  const n = region.vertexIndices.length;
  return [cx / n, cy / n, cz / n];
}
