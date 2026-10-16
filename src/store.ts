export interface CounterState {
  readonly counter: number
}

export type Listener = (state: CounterState) => void

// Példányonként egy store: ez a React-en kívüli "igazság forrása",
// így a natív JS API és a React komponens ugyanazt az állapotot látja.
export function createCounterStore(counterDefault: number) {
  let state: CounterState = Object.freeze({ counter: counterDefault })
  const listeners = new Set<Listener>()

  const setCounter = (value: number) => {
    if (!Number.isFinite(value)) {
      throw new TypeError(`ReactApp: a counter értéke csak véges szám lehet, kapott: ${value}`)
    }
    if (value === state.counter) return
    state = Object.freeze({ ...state, counter: value })
    listeners.forEach((listener) => listener(state))
  }

  return {
    getState: () => state,
    subscribe(listener: Listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    setCounter,
    increase: () => setCounter(state.counter + 1),
    decrease: () => setCounter(state.counter - 1),
    reset: () => setCounter(counterDefault),
  }
}

export type CounterStore = ReturnType<typeof createCounterStore>
