import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import Home from './home/Home'
import './styles/globals.css'

// ponytail: themed Home variants, one path check — no router dependency.
// render.yaml already rewrites every path to index.html, so both paths resolve
// in production too.
const path = window.location.pathname.replace(/\/$/, '')
const Page = path === '/home' ? Home : path === '/home-black' ? () => <Home dark /> : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
