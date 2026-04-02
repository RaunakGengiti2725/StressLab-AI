/**
 * Maps scalar stress values to RGB vertex colors using a turbo-inspired colormap.
 *
 * Progression: blue → cyan → green → yellow → red
 * Used with MeshStandardMaterial vertexColors.
 */
export function stressToColors(
  stressValues: Float32Array,
  vertexCount: number,
  maxStress: number,
): Float32Array {
  const colors = new Float32Array(vertexCount * 3);
  const safeMax = Math.max(maxStress, 0.001);

  for (let i = 0; i < vertexCount; i++) {
    const t = Math.min(1, stressValues[i]! / safeMax);
    const [r, g, b] = turboColor(t);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  return colors;
}

function turboColor(t: number): [number, number, number] {
  if (t < 0.2) {
    const s = t / 0.2;
    return [0.05, 0.1 + s * 0.4, 0.7 + s * 0.3];
  }
  if (t < 0.4) {
    const s = (t - 0.2) / 0.2;
    return [0.05 + s * 0.1, 0.5 + s * 0.5, 1.0 - s * 0.3];
  }
  if (t < 0.6) {
    const s = (t - 0.4) / 0.2;
    return [0.15 + s * 0.55, 1.0, 0.7 - s * 0.5];
  }
  if (t < 0.8) {
    const s = (t - 0.6) / 0.2;
    return [0.7 + s * 0.3, 1.0 - s * 0.3, 0.2 - s * 0.15];
  }
  const s = (t - 0.8) / 0.2;
  return [1.0, 0.7 - s * 0.55, 0.05 + s * 0.05];
}

/**
 * Applies vertex colors to a BufferGeometry.
 * Creates the color attribute if it doesn't exist.
 */
export function applyVertexColors(
  colorAttr: Float32Array,
  vertexCount: number,
  baseColor: [number, number, number],
  regions: {
    hoveredRegionId: number | null;
    anchorRegionId: number | null;
    forceRegionId: number | null;
  },
  regionVertices: Map<number, number[]>,
  heatmapColors: Float32Array | null,
): Float32Array {
  const colors = colorAttr;

  if (heatmapColors) {
    colors.set(heatmapColors);
  } else {
    for (let i = 0; i < vertexCount; i++) {
      colors[i * 3] = baseColor[0];
      colors[i * 3 + 1] = baseColor[1];
      colors[i * 3 + 2] = baseColor[2];
    }
  }

  if (regions.hoveredRegionId !== null && !heatmapColors) {
    const verts = regionVertices.get(regions.hoveredRegionId);
    if (verts) {
      for (const vi of verts) {
        colors[vi * 3] = Math.min(1, colors[vi * 3]! * 1.3 + 0.15);
        colors[vi * 3 + 1] = Math.min(1, colors[vi * 3 + 1]! * 1.3 + 0.15);
        colors[vi * 3 + 2] = Math.min(1, colors[vi * 3 + 2]! * 1.3 + 0.2);
      }
    }
  }

  if (regions.anchorRegionId !== null) {
    const verts = regionVertices.get(regions.anchorRegionId);
    if (verts) {
      for (const vi of verts) {
        colors[vi * 3] = 0.15;
        colors[vi * 3 + 1] = 0.4;
        colors[vi * 3 + 2] = 1.0;
      }
    }
  }

  if (regions.forceRegionId !== null) {
    const verts = regionVertices.get(regions.forceRegionId);
    if (verts) {
      for (const vi of verts) {
        colors[vi * 3] = 1.0;
        colors[vi * 3 + 1] = 0.6;
        colors[vi * 3 + 2] = 0.15;
      }
    }
  }

  return colors;
}
