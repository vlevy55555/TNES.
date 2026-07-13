import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { walls, WALL_SPACING } from '../../data/artworks'

// ponytail: procedural plank texture on a canvas — no image asset, no loader
function makeWoodTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const shades = ['#6e4526', '#7a4f2c', '#5f3a1f', '#835832', '#714828', '#583517', '#7d5230', '#684123']
  const plank = 64
  shades.forEach((shade, i) => {
    ctx.fillStyle = shade
    ctx.fillRect(i * plank, 0, plank, 512)
    // grain streaks
    ctx.strokeStyle = 'rgba(60, 35, 15, 0.16)'
    for (let g = 0; g < 5; g++) {
      ctx.beginPath()
      ctx.moveTo(i * plank + 8 + g * 12, 0)
      ctx.lineTo(i * plank + 12 + g * 12, 512)
      ctx.stroke()
    }
    // seams + staggered butt joints
    ctx.fillStyle = 'rgba(30, 18, 8, 0.5)'
    ctx.fillRect(i * plank, 0, 2, 512)
    ctx.fillRect(i * plank, (i * 197) % 512, plank, 2)
  })
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.repeat.set(11, 4.8) // ~0.4u planks running toward the viewer
  return texture
}
const woodTexture = makeWoodTexture()

const centerX = ((walls.length - 1) * WALL_SPACING) / 2
// span every wall plus a margin, so floor/ceiling never fall short as walls grow
const WIDTH = (walls.length - 1) * WALL_SPACING + 8
const DEPTH = 20
// matches the wall's top edge (Wall.tsx: bottom -2.2, height 4.93) so the
// ceiling sits flush with the walls, only exposed once the camera pulls back
const CEILING_Y = 2.73

export function Room() {
  return (
    <group position={[centerX, 0, 0]}>
      {/* wooden floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, DEPTH / 2 - 1]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshStandardMaterial map={woodTexture} />
      </mesh>
      {/* white ceiling — unlit and deliberately brighter than the lit walls,
          so it still reads clearly once tone-mapped and exposed */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CEILING_Y, DEPTH / 2 - 1]}>
        <planeGeometry args={[WIDTH, DEPTH]} />
        <meshBasicMaterial color="#faf8f2" />
      </mesh>
      {/* backdrop closing the gap behind/between the angled walls */}
      <mesh position={[0, 0, -0.55]}>
        <planeGeometry args={[WIDTH, 6]} />
        <meshStandardMaterial color="#e3d9c9" />
      </mesh>
    </group>
  )
}
