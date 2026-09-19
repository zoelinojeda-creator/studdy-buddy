import { create } from 'zustand'

// Puerto de toast() (docs/js/utils.js): un solo mensaje a la vez, que se
// reemplaza si llega otro, y se apaga a los 2s por defecto.
interface ToastState {
  message: string | null
  id: number
  show: (message: string, duration?: number) => void
}

let timer: ReturnType<typeof setTimeout> | undefined

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  id: 0,
  show: (message, duration = 2000) => {
    clearTimeout(timer)
    set((s) => ({ message, id: s.id + 1 }))
    timer = setTimeout(() => set({ message: null }), duration)
  },
}))

// Funcion suelta para llamar desde cualquier lado (componentes, stores),
// igual que el toast() global de la app vieja.
export function toast(message: string, duration?: number): void {
  useToastStore.getState().show(message, duration)
}
