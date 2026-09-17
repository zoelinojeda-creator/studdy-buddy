import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useEstudioStore } from '../../store/useEstudioStore'
import { getAiKey, saveAiKey, type Metodo } from '../../lib/ai'
import styles from './Material.module.css'

// Mismos 8 chips que docs/index.html.
const CHIPS = ['Matemáticas', 'Historia', 'Biología', 'Química', 'Física', 'Inglés', 'Literatura', 'Geografía']

const METODO_LABEL: Record<Metodo, string> = {
  flash: '🃏 Flashcards',
  quiz: '🎯 Quiz',
  complete: '✏️ Completar',
  rapid: '⚡ Quiz Rápido',
}

// Mismos 4 pasos que docs/js (stepList) — corren en su propio timeline
// (700ms cada uno) en paralelo a la llamada real a la IA, sin relación con
// cuándo efectivamente responde.
const PASOS = ['Usando materia y tema...', 'Generando preguntas...', 'Añadiendo explicaciones...', '¡Casi listo!']
const PASO_INTERVALO_MS = 700

export function Material({ onVolver, onGenerado }: { onVolver: () => void; onGenerado: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const method = useEstudioStore((s) => s.method)
  const subject = useEstudioStore((s) => s.subject)
  const topic = useEstudioStore((s) => s.topic)
  const questionCount = useEstudioStore((s) => s.questionCount)
  const loading = useEstudioStore((s) => s.loading)
  const error = useEstudioStore((s) => s.error)
  const setSubject = useEstudioStore((s) => s.setSubject)
  const setTopic = useEstudioStore((s) => s.setTopic)
  const nudgeCount = useEstudioStore((s) => s.nudgeCount)
  const generate = useEstudioStore((s) => s.generate)

  const [aiKey, setAiKeyLocal] = useState('')
  const [ayudaAbierta, setAyudaAbierta] = useState(false)
  const [pasoActivo, setPasoActivo] = useState(-1)

  useEffect(() => {
    setAiKeyLocal(getAiKey())
  }, [])

  useEffect(() => {
    if (!loading) {
      setPasoActivo(-1)
      return
    }
    setPasoActivo(0)
    let i = 0
    const id = setInterval(() => {
      i++
      if (i >= PASOS.length) {
        clearInterval(id)
        return
      }
      setPasoActivo(i)
    }, PASO_INTERVALO_MS)
    return () => clearInterval(id)
  }, [loading])

  function handleAiKeyChange(value: string) {
    setAiKeyLocal(value)
    saveAiKey(value)
  }

  async function handleGenerate() {
    const res = await generate()
    if (res.ok) onGenerado()
  }

  const progreso = (subject.trim() ? 50 : 0) + (topic.trim() ? 50 : 0)
  const metodoLabel = METODO_LABEL[method ?? 'quiz']

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <button type="button" className={styles.back} onClick={onVolver}>
          ← Método
        </button>

        <div className={styles.headRow}>
          <div className={styles.pill}>{metodoLabel}</div>
          <div className={styles.xpBadge}>⭐ {profile?.xp ?? 0} XP</div>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Paso 1 — Tema</h2>
          <input
            className={styles.input}
            type="text"
            placeholder="Materia (ej: Historia)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <input
            className={styles.input}
            type="text"
            placeholder="Tema específico (ej: Revolución Francesa)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <div className={styles.chips}>
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className={subject === chip ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                onClick={() => setSubject(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Paso 2 — Cantidad de preguntas</h2>
          <p className={styles.hint}>
            Mínimo 5, máximo 20. Cada acierto suma 10 XP; más preguntas, más XP por pasada.
          </p>
          <div className={styles.qtyRow}>
            <button type="button" className={styles.qtyBtn} onClick={() => nudgeCount(-1)}>
              −
            </button>
            <div className={styles.qtyVal}>{questionCount} preguntas</div>
            <button type="button" className={styles.qtyBtn} onClick={() => nudgeCount(1)}>
              +
            </button>
          </div>
        </section>

        <section className={styles.sectionUpcoming}>
          <h2 className={styles.sectionTitle}>Próximas mejoras — Apuntes y TXT</h2>
          <p className={styles.hint}>
            En esta prueba de concepto la IA genera solo con materia y tema, para no gastar tantos tokens. Pegar
            apuntes o cargar un .txt para contextualizar las preguntas queda para más adelante.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Opcional — Clave de Gemini</h2>
          <input
            className={styles.input}
            type="text"
            autoComplete="off"
            placeholder="Si no hay clave, se usa la IA compartida de StudyBuddy"
            value={aiKey}
            onChange={(e) => handleAiKeyChange(e.target.value)}
          />
          <button type="button" className={styles.link} onClick={() => setAyudaAbierta((v) => !v)}>
            ❓ ¿Cómo consigo una clave gratis?
          </button>
          {ayudaAbierta && (
            <>
              <ol className={styles.ayudaLista}>
                <li>
                  Entrá a{' '}
                  <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer">
                    aistudio.google.com/api-keys
                  </a>{' '}
                  e iniciá sesión con tu cuenta de Google.
                </li>
                <li>Tocá el botón &quot;Create API key&quot; / &quot;Crear clave de API&quot;.</li>
                <li>Ponele un nombre a la clave (podés dejar el que sugiere por defecto).</li>
                <li>Elegí el proyecto de Gemini por defecto (no hace falta crear uno nuevo la primera vez).</li>
                <li>Tocá &quot;Create key&quot; para generarla.</li>
                <li>Copiá la clave y pegala en el campo de arriba.</li>
              </ol>
              <p className={styles.hint}>Es gratis, pero tiene un límite de usos por día — alcanza de sobra.</p>
            </>
          )}
        </section>

        {error && (
          <section className={styles.errorPanel}>
            <div className={styles.errorIcon}>⚠️</div>
            <p className={styles.errorTitle}>No se pudo generar</p>
            <p className={styles.errorMsg}>{error}</p>
            <button type="button" className={styles.buttonOn} onClick={handleGenerate}>
              Reintentar
            </button>
          </section>
        )}

        <div className={styles.sticky}>
          <div className={styles.progTrack}>
            <div className={styles.progFill} style={{ width: `${progreso}%` }} />
          </div>
          <p className={styles.progLbl}>
            {progreso < 100 ? `Completa materia y tema (${progreso}%)` : '¡Listo para generar!'}
          </p>
          <button
            type="button"
            className={progreso >= 100 ? `${styles.button} ${styles.buttonOn}` : styles.button}
            disabled={progreso < 100 || loading}
            onClick={handleGenerate}
          >
            Generar con IA! ✨
          </button>
        </div>

        {loading && (
          <div className={styles.loadOv}>
            <div className={styles.loadCard}>
              <div className={styles.spinner} />
              <p className={styles.loadTitle}>Mindy prepara tu actividad... 🧠</p>
              <ul className={styles.stepList}>
                {PASOS.map((paso, i) => (
                  <li key={paso} className={i <= pasoActivo ? styles.stepDone : undefined}>
                    <span className={styles.stepDot}>{i + 1}</span>
                    {paso}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
