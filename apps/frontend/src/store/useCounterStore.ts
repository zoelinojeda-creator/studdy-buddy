import { create } from 'zustand'

interface CounterState {
  count: number
  increment: () => void
}

// Store de prueba (smoke test) para confirmar que Zustand funciona
// junto con Vite/React/TypeScript. No es estado real de la app todavia.
export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
