import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useEstudioStore } from '../../store/useEstudioStore'
import type { CompleteItem, FlashItem, QuizItem } from '../../lib/ai'
import styles from './Juego.module.css'

const METODO_LABEL: Record<string, string> = {
  flash: '🃏 Flashcards',
  quiz: '🎯 Quiz',
  complete: '✏️ Completar',
  rapid: '⚡ Quiz Rápido',
}

const RAPID_MS = 10000
const LETRAS = ['A', 'B', 'C', 'D']

// Puerto de answersMatch (docs/js/utils.js) — match difuso, sin distinguir
// mayusculas/espacios, acepta que una sea substring de la otra.
function answersMatch(userAnswer: string, correctAnswer: string): boolean {
  const ua = (userAnswer || '').trim().toLowerCase()
  const ca = (correctAnswer || '').trim().toLowerCase()
  if (!ua || !ca) return false
  return ua === ca || ca.includes(ua) || ua.includes(ca)
}

type DotEstado = 'pending' | 'cur' | 'ok' | 'fail'

export function Juego({ onTerminar }: { onTerminar: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const method = useEstudioStore((s) => s.method)
  const subject = useEstudioStore((s) => s.subject)
  const preguntas = useEstudioStore((s) => s.preguntas)
  const terminarJuego = useEstudioStore((s) => s.terminarJuego)

  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [verificado, setVerificado] = useState<'ok' | 'fail' | null>(null)
  const [msLeft, setMsLeft] = useState(RAPID_MS)
  const [dots, setDots] = useState<DotEstado[]>([])
  const [terminando, setTerminando] = useState(false)

  // Espejo sincronico de "answered" — el temporizador del rapid arma su
  // callback ANTES de que React vuelva a renderizar, asi que necesita un
  // valor que este siempre al dia, no el de la clausura del efecto.
  const answeredRef = useRef(false)

  const total = preguntas?.length ?? 0
  const pregunta = preguntas?.[idx]

  useEffect(() => {
    setDots(Array(total).fill('pending').map((_, i) => (i === 0 ? 'cur' : 'pending')) as DotEstado[])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preguntas])

  function marcarDot(i: number, estado: DotEstado) {
    setDots((prev) => {
      const next = [...prev]
      next[i] = estado
      if (next[i + 1] === 'pending') next[i + 1] = 'cur'
      return next
    })
  }

  function avanzarA(finalCorrect: number, finalWrong: number, finalScore: number) {
    const next = idx + 1
    if (next >= total) {
      setTerminando(true)
      terminarJuego(finalCorrect, finalWrong, finalScore).then(onTerminar)
      return
    }
    setIdx(next)
    setAnswered(false)
    answeredRef.current = false
    setSelected(null)
    setFlipped(false)
    setInputValue('')
    setVerificado(null)
  }

  // === Flashcards ===
  function handleFlashAdvance(knew: boolean) {
    const nc = correct + (knew ? 1 : 0)
    const nw = wrong + (knew ? 0 : 1)
    setCorrect(nc)
    setWrong(nw)
    setScore(knew ? score + 10 : score)
    marcarDot(idx, knew ? 'ok' : 'fail')
    avanzarA(nc, nw, knew ? score + 10 : score)
  }

  // === Quiz / Quiz Rápido ===
  function handleQuizAnswer(i: number) {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    setSelected(i)

    const it = pregunta as QuizItem
    const isRapid = method === 'rapid'
    let nc = correct
    let nw = wrong
    let ns = score
    let ncombo = combo

    if (i === it.correct) {
      nc++
      if (isRapid) {
        ncombo++
        ns += 10 + 2 * ncombo
      } else {
        ns += 10
      }
      marcarDot(idx, 'ok')
    } else {
      nw++
      ncombo = 0
      marcarDot(idx, 'fail')
    }

    setCorrect(nc)
    setWrong(nw)
    setScore(ns)
    setCombo(ncombo)

    if (isRapid) {
      setTimeout(() => avanzarA(nc, nw, ns), 1200)
    }
  }

  function handleRapidTimeout() {
    if (answeredRef.current) return
    answeredRef.current = true
    setAnswered(true)
    setCombo(0)
    const nw = wrong + 1
    setWrong(nw)
    marcarDot(idx, 'fail')
    setTimeout(() => avanzarA(correct, nw, score), 1200)
  }

  useEffect(() => {
    if (method !== 'rapid' || !pregunta) return
    const deadline = Date.now() + RAPID_MS
    setMsLeft(RAPID_MS)
    const id = setInterval(() => {
      const left = Math.max(0, deadline - Date.now())
      setMsLeft(left)
      if (left <= 0) {
        clearInterval(id)
        handleRapidTimeout()
      }
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, method])

  // === Completar ===
  function handleVerificar() {
    if (answered) return
    const ua = inputValue.trim()
    if (!ua) return
    const it = pregunta as CompleteItem
    const ok = answersMatch(ua, it.answer)
    setAnswered(true)
    setVerificado(ok ? 'ok' : 'fail')
    if (ok) setInputValue(it.answer)

    const nc = correct + (ok ? 1 : 0)
    const nw = wrong + (ok ? 0 : 1)
    const ns = ok ? score + 10 : score
    setCorrect(nc)
    setWrong(nw)
    setScore(ns)
    marcarDot(idx, ok ? 'ok' : 'fail')
    setTimeout(() => avanzarA(nc, nw, ns), 1600)
  }

  if (!method || !preguntas || !pregunta) {
    return (
      <div className={styles.wrap}>
        <p className={styles.hint}>No hay preguntas cargadas.</p>
      </div>
    )
  }

  const isRapid = method === 'rapid'
  const rapidPct = (msLeft / RAPID_MS) * 100

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titulo}>
            {METODO_LABEL[method]} — {subject}
          </div>
          <div className={styles.headRight}>
            {isRapid && (
              <div className={styles.comboChip}>
                🔥 Racha x{combo}
              </div>
            )}
            <div className={styles.scoreChip}>⭐ {score} pts</div>
          </div>
        </div>

        <div className={styles.dotsRow}>
          {dots.map((estado, i) => (
            <div key={i} className={`${styles.dot} ${styles[`dot_${estado}`]}`} />
          ))}
        </div>

        <div className={styles.body}>
          {method === 'flash' && (
            <div className={styles.fcWrap} onClick={() => setFlipped((v) => !v)}>
              <div className={flipped ? `${styles.fc} ${styles.fcFlip}` : styles.fc}>
                <div className={styles.face}>
                  <span className={styles.faceLbl}>PREGUNTA</span>
                  <div className={styles.faceTxt}>{(pregunta as FlashItem).question}</div>
                </div>
                <div className={`${styles.face} ${styles.faceBack}`}>
                  <span className={styles.faceLbl}>RESPUESTA</span>
                  <div className={styles.faceTxt}>{(pregunta as FlashItem).answer}</div>
                </div>
              </div>
            </div>
          )}
          {method === 'flash' && (
            <>
              <p className={styles.fcHint}>Tocá la tarjeta para ver la respuesta</p>
              <div className={styles.fcBtns}>
                <button type="button" className={styles.btnNo} onClick={() => handleFlashAdvance(false)}>
                  ✗ No la sabía
                </button>
                <button type="button" className={styles.btnYes} onClick={() => handleFlashAdvance(true)}>
                  ✓ La sabía!
                </button>
              </div>
            </>
          )}

          {(method === 'quiz' || method === 'rapid') && (
            <>
              {isRapid && (
                <div className={styles.rapidHud}>
                  <div className={styles.rapidBar}>
                    <div
                      className={rapidPct < 30 ? `${styles.rapidFill} ${styles.rapidUrgent}` : styles.rapidFill}
                      style={{ width: `${rapidPct}%` }}
                    />
                  </div>
                  <span className={styles.rapidSec}>{Math.ceil(msLeft / 1000)}</span>
                </div>
              )}
              <div className={styles.qTxt}>{(pregunta as QuizItem).question}</div>
              <div className={styles.optsList}>
                {(pregunta as QuizItem).options.map((opt, i) => {
                  const it = pregunta as QuizItem
                  let cls = styles.opt
                  if (answered) {
                    if (i === it.correct) cls = `${styles.opt} ${styles.optOk}`
                    else if (i === selected) cls = `${styles.opt} ${styles.optFail}`
                  }
                  return (
                    <button key={i} type="button" className={cls} disabled={answered} onClick={() => handleQuizAnswer(i)}>
                      <span className={styles.optLtr}>{LETRAS[i]}</span>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {answered && (pregunta as QuizItem).explanation && (
                <div className={styles.feedback}>{(pregunta as QuizItem).explanation}</div>
              )}
              {!isRapid && answered && (
                <button type="button" className={styles.btnNext} onClick={() => avanzarA(correct, wrong, score)}>
                  Siguiente →
                </button>
              )}
            </>
          )}

          {method === 'complete' && (
            <>
              <div className={styles.cSent}>
                {(pregunta as CompleteItem).sentence.split('_____').map((parte, i, arr) => (
                  <span key={i}>
                    {parte}
                    {i < arr.length - 1 && <span className={styles.blank}>_____</span>}
                  </span>
                ))}
              </div>
              <input
                className={styles.cInp}
                style={verificado ? { borderColor: verificado === 'ok' ? 'var(--accent3)' : 'var(--accent2)' } : undefined}
                placeholder="Tu respuesta..."
                value={inputValue}
                disabled={answered}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleVerificar()
                }}
                autoFocus
              />
              {verificado && (pregunta as CompleteItem).explanation && (
                <div className={styles.feedback}>{(pregunta as CompleteItem).explanation}</div>
              )}
              {verificado === 'fail' && (
                <p className={styles.hint}>Respuesta: {(pregunta as CompleteItem).answer}</p>
              )}
              <button type="button" className={styles.btnVerify} disabled={answered} onClick={handleVerificar}>
                Verificar ✓
              </button>
            </>
          )}
        </div>

        {terminando && <p className={styles.hint}>Guardando resultados...</p>}
        {!profile && <p className={styles.hint}>Cargando perfil...</p>}
      </div>
    </div>
  )
}
