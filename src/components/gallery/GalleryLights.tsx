export function GalleryLights() {
  return (
    <>
      {/* bright, even, neutral light for a white studio — the per-wall ceiling
          lamps add the three scallops at the top */}
      <ambientLight intensity={0.92} color="#fdfbf7" />
      <directionalLight position={[0, 3, 4]} intensity={0.4} color="#ffffff" />
      <directionalLight position={[-2, -1, 3]} intensity={0.1} color="#ffffff" />
    </>
  )
}
