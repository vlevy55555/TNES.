import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Home from './home/Home'
import Shop from './home/Shop'
import Product from './home/Product'
import './styles/globals.css'

// ponytail: one path check, no router dependency. render.yaml already rewrites
// every path to index.html, so all of these resolve in production too.
//
//   /                 the landing page — the site's front door
//   /home             its old address, kept so existing links still land
//   /home-black       the dark variant, at the address it has always had
//   /shop             the print index
//   /shop/<id>        one work, by its artwork id
//   /gallery          the 3D exhibition
const path = window.location.pathname.replace(/\/$/, '')
const productId = path.startsWith('/shop/') ? path.slice('/shop/'.length) : ''

const Page =
  productId ? () => <Product id={productId} />
  : path === '/shop' ? Shop
  : path === '/home-black' ? () => <Home dark />
  : path === '/gallery' ? App
  : Home

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
