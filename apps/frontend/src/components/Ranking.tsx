import type { RankingEntry } from '../store/useAulasStore'
import { avatarEmoji } from '../data/avatars'
import styles from './Ranking.module.css'

const MEDALLAS = ['🥇', '🥈', '🥉']

export function Ranking({ entries, resaltarAlumnoId }: { entries: RankingEntry[]; resaltarAlumnoId?: string }) {
  if (entries.length === 0) {
    return <p className={styles.hint}>Todavía no hay nadie para rankear en esta aula.</p>
  }

  return (
    <div className={styles.list}>
      {entries.map((entry) => (
        <div
          key={entry.alumnoId}
          className={
            entry.alumnoId === resaltarAlumnoId ? `${styles.entry} ${styles.entryOn}` : styles.entry
          }
        >
          <span className={styles.posicion}>{MEDALLAS[entry.posicion - 1] ?? `#${entry.posicion}`}</span>
          <span className={styles.avatar}>{avatarEmoji(entry.avatar)}</span>
          <div className={styles.info}>
            <span className={styles.nombre}>{entry.username}</span>
            <span className={styles.desglose}>
              ⭐{entry.xpGanado} XP en el aula · Nv.{entry.nivel} · 🔥{entry.racha}
            </span>
          </div>
          <span className={styles.puntaje}>{entry.puntaje}</span>
        </div>
      ))}
    </div>
  )
}
