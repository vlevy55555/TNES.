// Shopify caps product images at 20 MP / 20 MB; the masters are up to 208 MP.
// 4472px long edge is Shopify's max zoom render, so anything above it is waste.
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'node:fs'

const SRC = '/home/eduardo/TNES/30-photos-release/v1-products (place_subject_year_v1)-20260828T053140Z-1-001/v1-products (place_subject_year_v1)'
const OUT = '/home/eduardo/TNES/shopify-release/images'
mkdirSync(OUT, { recursive: true })

const products = JSON.parse(readFileSync('/home/eduardo/TNES/shopify-release/products.json', 'utf8'))
for (const p of products) {
  const info = await sharp(`${SRC}/${p.image}`)
    .resize(4472, 4472, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(`${OUT}/${p.handle}.jpg`)
  console.log(`${p.handle}.jpg ${info.width}x${info.height} ${(info.size / 1e6).toFixed(1)}MB`)
}
