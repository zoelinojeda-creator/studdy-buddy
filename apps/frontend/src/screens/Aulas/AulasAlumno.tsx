import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useAulasStore } from '../../store/useAulasStore'
import { Ranking } from '../../components/Ranking'
import { Button } from '../../components/ui/Button'
import styles from './Aulas.module.css'

export function AulasAlumno({ onVolver }: { onVolver: () => void }) {
  const session = useAuthStore((s) => s.session)

  const misAulasAlumno = useAulasStore((s) => s.misAulasAlumno)
  const loading = useAulasStore((s) => s.loading)
  const rankingPorAula = useAulasStore((s) => s.rankingPorAula)
  const cargarMisAulasAlumno = useAulasStore((s) => s.cargarMisAulasAlumno)
  const unirseAula = useAulasStore((s) => s.unirseAula)
  const cargarRanking = useAulasStore((s) => s.cargarRanking)

  const [codigo, setCodigo] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [aulaSeleccionada, setAulaSeleccionada] = useState<string | null>(null)

  useEffect(() => {
    cargarMisAulasAlumno()
  }, [cargarMisAulasAlumno])

  function handleVerRanking(aulaId: string) {
    const abriendo = aulaId !== aulaSeleccionada
    setAulaSeleccionada(abriendo ? aulaId : null)
    if (abriendo && !rankingPorAula[aulaId]) {
      cargarRanking(aulaId)
    }
  }

  async function handleUnirse(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    const res = await unirseAula(codigo.trim().toUpperCase())
    if (!res.ok) {
      setMessage(res.error ?? 'No se pudo unir al aula')
      return
    }
    setCodigo('')
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Button variant="secondary" onClick={onVolver}>
          ← Volver
        </Button>

        <h1 className={styles.title}>Mis aulas</h1>

        <form className={styles.form} onSubmit={handleUnirse}>
          <input
            className={styles.input}
            type="text"
            placeholder="Código del aula"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            maxLength={6}
            required
          />
          <button className={styles.button} type="submit">
            Unirme
          </button>
        </form>

        {message && <p className={styles.error}>{message}</p>}
        {loading && <p className={styles.hint}>Cargando...</p>}

        <div className={styles.list}>
          {misAulasAlumno.length === 0 && !loading && (
            <p className={styles.hint}>Todavía no te uniste a ninguna aula.</p>
          )}
          {misAulasAlumno.map((aula) => (
            <div key={aula.id} className={styles.aula}>
              <button type="button" className={styles.aulaHeader} onClick={() => handleVerRanking(aula.id)}>
                <span className={styles.aulaNombre}>{aula.nombre}</span>
                <span className={styles.aulaCodigo}>Profe: {aula.profesorUsername} · 🏆 Ver ranking</span>
              </button>

              {aulaSeleccionada === aula.id && (
                <div className={styles.roster}>
                  <Ranking entries={rankingPorAula[aula.id] ?? []} resaltarAlumnoId={session?.user.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
