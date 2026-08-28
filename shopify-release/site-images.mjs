// The 18 new works as site assets, matching the existing v1 webp convention
// (2560px long edge) rather than the 4472px print-grade JPEGs Shopify got.
import sharp from 'sharp'
import { readFileSync, existsSync } from 'node:fs'

const OUT = '/home/eduardo/TNES/public/artworks/v1'
const products = JSON.parse(readFileSync('/home/eduardo/TNES/shopify-release/products.json', 'utf8'))
for (const p of products.filter((x) => x.new)) {
  const name = p.image.replace(/\.(jpe?g)$/i, '.webp')
  if (existsSync(`${OUT}/${name}`)) { console.log(`${name} exists`); continue }
  const i = await sharp(`/home/eduardo/TNES/shopify-release/images/${p.handle}.jpg`)
    .resize(2560, 2560, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(`${OUT}/${name}`)
  console.log(`${name} ${i.width}x${i.height} ${(i.size / 1024).toFixed(0)}KB`)
}
