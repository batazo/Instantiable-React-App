// Csak fejlesztői módban (vite dev) használt belépési pont: ugyanazt a
// window.ReactApp globált teszi elérhetővé, amit a build-elt IIFE bundle is.
import * as ReactApp from './index.tsx'

declare global {
  interface Window {
    ReactApp: typeof ReactApp
  }
}

window.ReactApp = ReactApp
