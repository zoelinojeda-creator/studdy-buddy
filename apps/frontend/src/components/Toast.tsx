import { useToastStore } from '../store/useToastStore'
import styles from './Toast.module.css'

// Se monta una sola vez en App.tsx (como BgCanvas) — el mensaje lo maneja
// useToastStore, se dispara con toast() desde cualquier lugar.
export function Toast() {
  const message = useToastStore((s) => s.message)
  const id = useToastStore((s) => s.id)
  if (!message) return null
  return (
    <div key={id} className={styles.toast} role="status">
      {message}
    </div>
  )
}
