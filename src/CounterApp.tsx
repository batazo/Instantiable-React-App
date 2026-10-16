import { useSyncExternalStore } from 'react'
import type { CounterStore } from './store.ts'

interface CounterAppProps {
  store: CounterStore
  title?: string
}

export function CounterApp({ store, title }: CounterAppProps) {
  const { counter } = useSyncExternalStore(store.subscribe, store.getState)

  return (
    <div className="ra-counter">
      {title && <h2 className="ra-counter__title">{title}</h2>}
      <div className="ra-counter__row">
        <button type="button" onClick={store.decrease} aria-label="Csökkentés">
          −
        </button>
        <output className="ra-counter__value">{counter}</output>
        <button type="button" onClick={store.increase} aria-label="Növelés">
          +
        </button>
      </div>
      <button type="button" className="ra-counter__reset" onClick={store.reset}>
        Alaphelyzet
      </button>
    </div>
  )
}
