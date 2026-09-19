import { useAuthStore } from '../../store/useAuthStore'
import { useEstudioStore } from '../../store/useEstudioStore'
import { Button } from '../../components/ui/Button'
import styles from './Resultados.module.css'

// Mismo corte de emoji/titulo/subtitulo por porcentaje que docs/js/screens/resultados.js.
function desempeño(pct: number): { emoji: string; titulo: string; sub: string } {
  if (pct >= 90) return { emoji: '🏆', titulo: '¡Excelente!', sub: 'Dominaste el tema completamente' }
  if (pct >= 70) return { emoji: '⭐', titulo: '¡Muy bien!', sub: 'Vas por buen camino' }
  if (pct >= 50) return { emoji: '💪', titulo: '¡Buen esfuerzo!', sub: 'Seguí practicando' }
  return { emoji: '📚', titulo: 'A estudiar más!', sub: 'La práctica lleva a la perfección' }
}

interface ResultadosProps {
  onNuevoTema: () => void
  onRepetir: () => void
  onVolverAMascota: () => void
}

export function Resultados({ onNuevoTema, onRepetir, onVolverAMascota }: ResultadosProps) {
  const profile = useAuthStore((s) => s.profile)
  const resultados = useEstudioStore((s) => s.resultados)
  const nuevoTema = useEstudioStore((s) => s.nuevoTema)

  function handleNuevoTema() {
    nuevoTema()
    onNuevoTema()
  }

  if (!resultados || !profile) {
    return (
      <div className={styles.wrap}>
        <p className={styles.hint}>Cargando resultados...</p>
      </div>
    )
  }

  const { emoji, titulo, sub } = desempeño(resultados.pct)

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.emoji}>{emoji}</div>
        <h1 className={styles.titulo}>{titulo}</h1>
        <p className={styles.sub}>{sub}</p>

        <div className={styles.xpBadge}>+{resultados.xpGanado} XP ganados</div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statVal}>{resultados.correct}</span>
            <span className={styles.statLbl}>Aciertos</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal}>{resultados.wrong}</span>
            <span className={styles.statLbl}>Errores</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statVal}>{resultados.pct}%</span>
            <span className={styles.statLbl}>Precisión</span>
          </div>
        </div>

        <p className={styles.nota}>
          Nivel {profile.level} — {profile.xp} / {profile.level * 100} XP acumulados
        </p>

        {resultados.rachaNueva && (
          <p className={styles.racha}>
            🔥 Racha: {resultados.racha} {resultados.racha === 1 ? 'día' : 'días'}!
          </p>
        )}

        <div className={styles.botones}>
          <button type="button" className={styles.btnSecundario} onClick={handleNuevoTema}>
            Nuevo tema
          </button>
          <button type="button" className={styles.btnPrimario} onClick={onRepetir}>
            Repetir
          </button>
        </div>

        <Button variant="secondary" onClick={onVolverAMascota}>
          ← Volver a Mascota
        </Button>
      </div>
    </div>
  )
}
