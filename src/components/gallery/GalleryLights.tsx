export function GalleryLights() {
  return (
    <>
      {/* bright, even base like the reference — the per-wall ceiling lamps
          add the three scallops at the top */}
      <ambientLight intensity={0.85} color="#fff6e8" />
      <directionalLight position={[0, 3, 4]} intensity={0.45} color="#fff3e0" />
      <directionalLight position={[-2, -1, 3]} intensity={0.12} />
    </>
  )
}
