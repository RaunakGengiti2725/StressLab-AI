import { Grid } from "@react-three/drei";

export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 80, 50]} intensity={0.8} castShadow={false} />
      <directionalLight position={[-30, 40, -20]} intensity={0.3} />
    </>
  );
}

export function SceneGrid() {
  return (
    <Grid
      args={[200, 200]}
      cellSize={5}
      cellThickness={0.5}
      cellColor="#1a1a2e"
      sectionSize={25}
      sectionThickness={1}
      sectionColor="#252540"
      fadeDistance={150}
      fadeStrength={1.5}
      infiniteGrid
      position={[0, -0.01, 0]}
    />
  );
}
