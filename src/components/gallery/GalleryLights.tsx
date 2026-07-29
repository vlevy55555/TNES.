export function GalleryLights() {
  return (
    <>
      {/* low, moody base like the reference — the ceiling spots do the real
          lighting; ambient only keeps shadow areas readable.
          previous (bright/flat) values: ambient 0.7, directional 0.31 / 0.1 */}
      <ambientLight intensity={0.2} color="#fff6e8" />
      <directionalLight position={[0, 3, 4]} intensity={0.1} color="#fff3e0" />
      <directionalLight position={[-2, -1, 3]} intensity={0.03} />
    </>
  )
}
