import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAulasStore } from '../../store/useAulasStore'
import { avatarEmoji } from '../../data/avatars'
import { Ranking } from '../../components/Ranking'
import { Button } from '../../components/ui/Button'
import styles from './Aulas.module.css'

export function AulasProfesor({ onVolver }: { onVolver: () => void }) {
  const misAulas = useAulasStore((s) => s.misAulas)
  const loading = useAulasStore((s) => s.loading)
  const alumnosPorAula = useAulasStore((s) => s.alumnosPorAula)
  const rankingPorAula = useAulasStore((s) => s.rankingPorAula)
  const cargarMisAulas = useAulasStore((s) => s.cargarMisAulas)
  const crearAula = useAulasStore((s) => s.crearAula)
  const cargarAlumnosDeAula = useAulasStore((s) => s.cargarAlumnosDeAula)
  const cargarRanking = useAulasStore((s) => s.cargarRanking)

  const [nombre, setNombre] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [aulaSeleccionada, setAulaSeleccionada] = useState<string | null>(null)
  const [verRanking, setVerRanking] = useState(false)

  useEffect(() => {
    cargarMisAulas()
  }, [cargarMisAulas])

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const res = await crearAula(nombre)
    if (!res.ok) {
      setMessage(res.error ?? 'No se pudo crear el aula')
      return
    }
    setNombre('')
  }

  function handleVerAlumnos(aulaId: string) {
    const abriendo = aulaId !== aulaSeleccionada
    setAulaSeleccionada(abriendo ? aulaId : null)
    setVerRanking(false)
    if (abriendo && !alumnosPorAula[aulaId]) {
      cargarAlumnosDeAula(aulaId)
    }
  }

  function handleToggleRanking(aulaId: string) {
    setVerRanking((prev) => !prev)
    if (!rankingPorAula[aulaId]) {
      cargarRanking(aulaId)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Button variant="secondary" onClick={onVolver}>
          ← Volver
        </Button>

        <h1 className={styles.title}>Mis aulas</h1>

        <form className={styles.form} onSubmit={handleCrear}>
          <input
            className={styles.input}
            type="text"
            placeholder="Nombre del aula"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <button className={styles.button} type="submit">
            Crear aula
          </button>
        </form>

        {message && <p className={styles.error}>{message}</p>}
        {loading && <p className={styles.hint}>Cargando...</p>}

        <div className={styles.list}>
          {misAulas.map((aula) => (
            <div key={aula.id} className={styles.aula}>
              <button type="button" className={styles.aulaHeader} onClick={() => handleVerAlumnos(aula.id)}>
                <span className={styles.aulaNombre}>{aula.nombre}</span>
                <span className={styles.aulaCodigo}>Código: {aula.codigo}</span>
              </button>

              {aulaSeleccionada === aula.id && (
                <div className={styles.roster}>
                  <button type="button" className={styles.rankingToggle} onClick={() => handleToggleRanking(aula.id)}>
                    {verRanking ? '📋 Ver lista de alumnos' : '🏆 Ver ranking'}
                  </button>

                  {verRanking ? (
                    <Ranking entries={rankingPorAula[aula.id] ?? []} />
                  ) : (
                    <>
                      {(alumnosPorAula[aula.id] ?? []).length === 0 && (
                        <p className={styles.hint}>Todavía no hay alumnos en esta aula.</p>
                      )}
                      {(alumnosPorAula[aula.id] ?? []).map((alumno) => (
                        <div key={alumno.alumnoId} className={styles.alumno}>
                          <span className={styles.alumnoAvatar}>{avatarEmoji(alumno.avatar)}</span>
                          <div className={styles.alumnoInfo}>
                            <span className={styles.alumnoNombre}>{alumno.username}</span>
                            <span className={styles.alumnoStats}>
                              Nv.{alumno.level} · ⭐{alumno.xp} XP · 🔥{alumno.streak} · ✅
                              {alumno.actividadesCompletadas}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
