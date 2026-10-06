import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import AnalyticsConsent from './analytics/AnalyticsConsent'
import './styles/globals.css'
import { setPageMetadata } from './seo'

const App = lazy(() => import('./App'))
const Home = lazy(() => import('./home/Home'))
const Shop = lazy(() => import('./home/Shop'))
const Product = lazy(() => import('./home/Product'))
const Cart = lazy(() => import('./home/Cart'))
const Favorites = lazy(() => import('./home/Favorites'))
const SpecialPrices = lazy(() => import('./home/SpecialPrices'))
const Privacy = lazy(() => import('./home/Privacy'))
const About = lazy(() => import('./home/About'))
const Moments = lazy(() => import('./home/Moments'))
const Wall = lazy(() => import('./home/Wall'))

// ponytail: one path check, no router dependency. render.yaml already rewrites
// every path to index.html, so all of these resolve in production too.
//
//   /                 the landing page — the site's front door
//   /home             its old address, kept so existing links still land
//   /home-black       the dark variant, at the address it has always had
//   /works            the print index
//   /works/<id>       one work, by its artwork id
//   /works/catalogs/<slug>  one catalog, as the Studio publishes it
//   /cart             the selection, as a page of the shop
//   /favorites        saved works, as a page of the shop
//   /special-prices   works offered at special prices
//   /about            Victor, and the door into VSL
//   /moments          where the work has been shown, and where it goes next
//   /wall             the gallery wall builder: works hung at true scale
//   /gallery          the 3D exhibition
const requestedPath = window.location.pathname.replace(/\/$/, '')
let path = requestedPath === '/home'
  ? '/'
  : requestedPath === '/shop' || requestedPath.startsWith('/shop/')
    ? requestedPath.replace(/^\/shop/, '/works')
    : requestedPath
let search = window.location.search
if (path === '/works' && new URLSearchParams(search).get('catalog') === 'the-hamptons') {
  path = '/works/catalogs/the-hamptons'
  search = ''
}
if (path !== requestedPath || search !== window.location.search) {
  window.history.replaceState(null, '', `${path}${search}${window.location.hash}`)
}
const isCatalogPath = path.startsWith('/works/catalogs/')
const productId = path.startsWith('/works/') && !isCatalogPath ? path.slice('/works/'.length) : ''
setPageMetadata(path || '/')

const Page =
  productId ? () => <Product id={productId} />
  : path === '/works' || isCatalogPath ? Shop
  : path === '/cart' ? Cart
  : path === '/favorites' ? Favorites
  : path === '/special-prices' ? SpecialPrices
  : path === '/privacy' ? Privacy
  : path === '/about' ? About
  : path === '/moments' ? Moments
  : path === '/wall' ? Wall
  : path === '/home-black' ? () => <Home dark />
  : path === '/gallery' ? App
  : Home

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className={`site-loading ${path === '/' || path === '/home-black' ? 'site-loading--dark' : ''}`} role="status">TNES.</div>}>
      <Page />
    </Suspense>
    <AnalyticsConsent />
  </StrictMode>,
)
