import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { TNES, walls, WALL_SPACING } from '../../data/artworks'

// ponytail: procedural polished-concrete floor on a canvas — monochrome, no
// asset, no loader. Soft mottling + fine speckle in the sand/beige range.
function makeFloorTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#c3bcb1'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 44; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 40 + Math.random() * 130
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    const dark = Math.random() > 0.5
    g.addColorStop(0, dark ? 'rgba(120, 112, 102, 0.06)' : 'rgba(228, 223, 215, 0.06)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
  }
  for (let i = 0; i < 1500; i++) {
    ctx.fillStyle = `rgba(92, 86, 78, ${Math.random() * 0.05})`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(6, 3.4)
  return texture
}
const floorTexture = makeFloorTexture()

const centerX = ((walls.length - 1) * WALL_SPACING) / 2
const WIDTH = 36
const DEPTH = 20
// matches the wall's top edge (Wall.tsx: bottom -2.2, height 4.93) so the
// ceiling sits flush with the walls, only exposed once the camera pulls back
const CEILING_Y = 2.73

export function Room() {
  return (
    <group position={[centerX, 0, 0]}>
      {/* polished-concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, DEPTH / 2 - 1]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshStandardMaterial map={floorTexture} />
      </mesh>
      {/* white ceiling — unlit and deliberately brighter than the lit walls,
          so it still reads clearly once tone-mapped and exposed */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEILING_Y, DEPTH / 2 - 1]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshBasicMaterial color="#fbfaf7" />
      </mesh>
      {/* backdrop closing the gap behind/between the angled walls */}
      <mesh position={[0, 0, -0.55]}>
        <planeGeometry args={[WIDTH, 6]} />
        <meshStandardMaterial color={TNES.beige} />
      </mesh>
    </group>
  )
}
