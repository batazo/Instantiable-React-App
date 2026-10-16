import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { CounterApp } from './CounterApp.tsx'
import { createCounterStore, type CounterState, type Listener } from './store.ts'
import styles from './CounterApp.css?inline'

export type { CounterState }

export interface InitOptions {
  /** A számláló kezdőértéke (alapértelmezés: 0). */
  counterDefault?: number
  /** Opcionális cím a példány felett. */
  title?: string
}

export interface ReactAppInstance {
  /** A példány renderelése egy CSS szelektorral vagy DOM elemmel megadott helyre. */
  render(target: string | Element): ReactAppInstance
  unmount(): void
  getState(): CounterState
  setCounter(value: number): void
  increase(): void
  decrease(): void
  reset(): void
  /** Feliratkozás az állapotváltozásokra; a visszaadott függvénnyel le lehet iratkozni. */
  subscribe(listener: Listener): () => void
}

const STYLE_ID = 'react-app-styles'

// A CSS a JS bundle része, így a beágyazó oldalnak elég egyetlen <script>.
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = styles
  document.head.append(style)
}

function resolveTarget(target: string | Element): Element {
  const element = typeof target === 'string' ? document.querySelector(target) : target
  if (!element) {
    throw new Error(`ReactApp: nem található a célelem: ${String(target)}`)
  }
  return element
}

export function init(options: InitOptions = {}): ReactAppInstance {
  const store = createCounterStore(options.counterDefault ?? 0)
  let root: Root | null = null

  const instance: ReactAppInstance = {
    render(target) {
      injectStyles()
      root?.unmount()
      root = createRoot(resolveTarget(target))
      root.render(
        <StrictMode>
          <CounterApp store={store} title={options.title} />
        </StrictMode>,
      )
      return instance
    },
    unmount() {
      root?.unmount()
      root = null
    },
    getState: store.getState,
    setCounter: store.setCounter,
    increase: store.increase,
    decrease: store.decrease,
    reset: store.reset,
    subscribe: store.subscribe,
  }

  return instance
}
