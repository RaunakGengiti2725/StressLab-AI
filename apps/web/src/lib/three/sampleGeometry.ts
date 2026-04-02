import * as THREE from "three";

/**
 * Creates a procedural L-bracket geometry suitable for stress testing demos.
 *
 * Profile (XY plane, extruded along Z):
 *
 *     ┌──┐
 *     │  │  8mm arm, 40mm tall
 *     │  │
 *     │  └──────┐
 *     │         │  40mm base, 8mm tall
 *     └─────────┘
 *     extruded 15mm deep
 *
 * The fillet at the inner corner is a 3mm quadratic bezier.
 * Geometry is centered at origin with recomputed normals.
 */
export function createSampleBracket(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  const baseW = 40;
  const baseH = 8;
  const armW = 8;
  const armH = 40;
  const fillet = 3;

  shape.moveTo(0, 0);
  shape.lineTo(baseW, 0);
  shape.lineTo(baseW, baseH);
  shape.lineTo(armW + fillet, baseH);
  shape.quadraticCurveTo(armW, baseH, armW, baseH + fillet);
  shape.lineTo(armW, armH);
  shape.lineTo(0, armH);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 15,
    bevelEnabled: false,
  });

  geometry.center();
  geometry.computeVertexNormals();

  return geometry;
}
