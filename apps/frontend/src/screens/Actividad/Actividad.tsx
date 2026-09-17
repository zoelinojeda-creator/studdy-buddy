import { useAuthStore } from '../../store/useAuthStore'
import { useEstudioStore } from '../../store/useEstudioStore'
import type { Metodo } from '../../lib/ai'
import styles from './Actividad.module.css'

// Mismos 4 metodos, iconos, nombres y descripciones que docs/index.html.
const METODOS: { id: Metodo; icono: string; nombre: string; descripcion: string; badge?: string }[] = [
  { id: 'flash', icono: '🃏', nombre: 'Flashcards', descripcion: 'Ve la pregunta, pensá y revelá la respuesta', badge: 'Popular' },
  { id: 'quiz', icono: '🎯', nombre: 'Quiz', descripcion: '4 opciones con explicación al responder' },
  { id: 'complete', icono: '✏️', nombre: 'Completar', descripcion: 'Escribí la palabra que falta en cada oración' },
  { id: 'rapid', icono: '⚡', nombre: 'Quiz Rápido', descripcion: 'Respondé rápido y acumulá racha', badge: 'Nuevo' },
]

export function Actividad({ onContinuar }: { onContinuar: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const method = useEstudioStore((s) => s.method)
  const setMethod = useEstudioStore((s) => s.setMethod)

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.xpBadge}>⭐ {profile?.xp ?? 0} XP</div>
        <h1 className={styles.title}>Elegí tu método</h1>
        <p className={styles.subtitle}>Primero el método, luego cargás tu material</p>

        <div className={styles.grid}>
          {METODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={method === m.id ? `${styles.metodo} ${styles.metodoOn}` : styles.metodo}
              onClick={() => setMethod(m.id)}
            >
              {m.badge && <span className={styles.badge}>{m.badge}</span>}
              <span className={styles.icono}>{m.icono}</span>
              <span className={styles.nombre}>{m.nombre}</span>
              <span className={styles.descripcion}>{m.descripcion}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={method ? `${styles.continuar} ${styles.continuarOn}` : styles.continuar}
          disabled={!method}
          onClick={onContinuar}
        >
          Cargar material →
        </button>
      </div>
    </div>
  )
}
