import * as THREE from "three";

/**
 * Computes per-vertex stress concentration factors based on geometry heuristics.
 *
 * Detects:
 * - Sharp corners / edges (high dihedral angle between adjacent face normals)
 * - Thin regions (vertices at edges where mesh folds back on itself)
 *
 * Returns a Float32Array of multipliers >= 1.0 per vertex.
 */
export function computeGeometryFactors(
  geometry: THREE.BufferGeometry,
): Float32Array {
  const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
  const indexAttr = geometry.getIndex();
  const vertexCount = posAttr.count;
  const faceCount = indexAttr
    ? indexAttr.count / 3
    : vertexCount / 3;

  const factors = new Float32Array(vertexCount).fill(1);

  const getVI = (face: number, corner: number): number =>
    indexAttr ? indexAttr.getX(face * 3 + corner) : face * 3 + corner;

  const faceNormals: THREE.Vector3[] = [];
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  for (let f = 0; f < faceCount; f++) {
    v0.fromBufferAttribute(posAttr, getVI(f, 0));
    v1.fromBufferAttribute(posAttr, getVI(f, 1));
    v2.fromBufferAttribute(posAttr, getVI(f, 2));
    const e1 = v1.clone().sub(v0);
    const e2 = v2.clone().sub(v0);
    faceNormals.push(e1.cross(e2).normalize());
  }

  const vertexFaces = new Map<number, number[]>();
  for (let f = 0; f < faceCount; f++) {
    for (let c = 0; c < 3; c++) {
      const vi = getVI(f, c);
      let list = vertexFaces.get(vi);
      if (!list) {
        list = [];
        vertexFaces.set(vi, list);
      }
      list.push(f);
    }
  }

  for (let vi = 0; vi < vertexCount; vi++) {
    const faces = vertexFaces.get(vi);
    if (!faces || faces.length < 2) continue;

    const avgNormal = new THREE.Vector3();
    for (const f of faces) {
      avgNormal.add(faceNormals[f]!);
    }
    avgNormal.divideScalar(faces.length).normalize();

    let normalVariance = 0;
    for (const f of faces) {
      normalVariance += 1 - faceNormals[f]!.dot(avgNormal);
    }
    normalVariance /= faces.length;

    if (normalVariance > 0.01) {
      factors[vi]! *= 1 + Math.min(normalVariance * 8, 2.5);
    }
  }

  const edgeLengths: number[] = [];
  const vertexMinEdge = new Float32Array(vertexCount).fill(Infinity);

  for (let f = 0; f < faceCount; f++) {
    const indices = [getVI(f, 0), getVI(f, 1), getVI(f, 2)];
    for (let c = 0; c < 3; c++) {
      const a = indices[c]!;
      const b = indices[(c + 1) % 3]!;
      v0.fromBufferAttribute(posAttr, a);
      v1.fromBufferAttribute(posAttr, b);
      const len = v0.distanceTo(v1);
      edgeLengths.push(len);
      vertexMinEdge[a] = Math.min(vertexMinEdge[a]!, len);
      vertexMinEdge[b] = Math.min(vertexMinEdge[b]!, len);
    }
  }

  if (edgeLengths.length > 0) {
    const avgEdge =
      edgeLengths.reduce((s, l) => s + l, 0) / edgeLengths.length;

    for (let vi = 0; vi < vertexCount; vi++) {
      if (vertexMinEdge[vi] === Infinity) continue;
      const ratio = vertexMinEdge[vi]! / avgEdge;
      if (ratio < 0.4) {
        factors[vi]! *= 1 + (0.4 - ratio) * 3;
      }
    }
  }

  return factors;
}
