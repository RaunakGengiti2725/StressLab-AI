import type { Vec3 } from "@/lib/simulation/types";

interface PinMarkerProps {
  position: Vec3;
}

export function PinMarker({ position }: PinMarkerProps) {
  return (
    <group position={position} renderOrder={10}>
      {/* Pin body */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 5, 8]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.3}
          depthTest={false}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Pin head */}
      <mesh position={[0, 5.2, 0]}>
        <sphereGeometry args={[0.8, 12, 12]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.4}
          depthTest={false}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Pin tip */}
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.5, 1.5, 8]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#2563eb"
          emissiveIntensity={0.4}
          depthTest={false}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}
