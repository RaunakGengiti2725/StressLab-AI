import { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useThree, type ThreeEvent } from "@react-three/fiber";

import type { Vec3 } from "@/lib/simulation/types";

interface ForceHandleProps {
  position: Vec3;
  onDrag: (delta: Vec3) => void;
  color?: string;
}

export function ForceHandle({
  position,
  onDrag,
  color = "#f59e0b",
}: ForceHandleProps) {
  const { camera, gl } = useThree();
  const [dragging, setDragging] = useState(false);
  const plane = useRef(new THREE.Plane());
  const origin = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const ndc = useRef(new THREE.Vector2());

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      plane.current.setFromNormalAndCoplanarPoint(camDir, e.point);
      origin.current.copy(e.point);
      setDragging(true);
    },
    [camera],
  );

  useEffect(() => {
    if (!dragging) return;

    const canvas = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.current.setFromCamera(ndc.current, camera);
      const hit = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(plane.current, hit);
      if (hit) {
        const delta = hit.sub(origin.current);
        onDrag([delta.x, delta.y, delta.z]);
      }
    };

    const onMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, camera, gl, onDrag]);

  return (
    <group>
      <mesh
        position={position}
        onPointerDown={handlePointerDown}
        renderOrder={10}
      >
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={dragging ? 0.6 : 0.3}
          depthTest={false}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}
