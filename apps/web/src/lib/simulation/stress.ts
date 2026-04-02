/**
 * Stress estimation from displacement gradient.
 *
 * For each vertex, computes the maximum displacement gradient with its neighbors.
 * Stress ≈ strain × Young's modulus × geometry concentration factor.
 *
 * This is an approximate model: it captures the intuition that stress is highest
 * where displacement changes rapidly (near the anchor constraint) and where
 * geometry concentrators exist (sharp corners, thin walls).
 */
export function computeStressField(
  originalPositions: Float32Array,
  displacements: Float32Array,
  vertexCount: number,
  vertexAdjacency: Map<number, number[]>,
  youngsModulusGpa: number,
  geometryFactors: Float32Array,
): Float32Array {
  const stress = new Float32Array(vertexCount);
  const MPa_SCALE = 50;

  for (let i = 0; i < vertexCount; i++) {
    const dxi = displacements[i * 3]!;
    const dyi = displacements[i * 3 + 1]!;
    const dzi = displacements[i * 3 + 2]!;
    const di = Math.sqrt(dxi * dxi + dyi * dyi + dzi * dzi);

    const neighbors = vertexAdjacency.get(i);
    if (!neighbors || neighbors.length === 0) continue;

    let maxGradient = 0;

    for (const j of neighbors) {
      const dxj = displacements[j * 3]!;
      const dyj = displacements[j * 3 + 1]!;
      const dzj = displacements[j * 3 + 2]!;
      const dj = Math.sqrt(dxj * dxj + dyj * dyj + dzj * dzj);

      const px = originalPositions[i * 3]! - originalPositions[j * 3]!;
      const py = originalPositions[i * 3 + 1]! - originalPositions[j * 3 + 1]!;
      const pz = originalPositions[i * 3 + 2]! - originalPositions[j * 3 + 2]!;
      const dist = Math.sqrt(px * px + py * py + pz * pz);

      if (dist > 0.001) {
        maxGradient = Math.max(maxGradient, Math.abs(di - dj) / dist);
      }
    }

    let stressValue = maxGradient * youngsModulusGpa * MPa_SCALE;
    stressValue *= geometryFactors[i]!;
    stress[i] = stressValue;
  }

  return stress;
}
