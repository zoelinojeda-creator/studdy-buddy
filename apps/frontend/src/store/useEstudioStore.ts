import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { guestStorage, GUEST_KEYS } from '../lib/guestStorage'
import { useAuthStore } from './useAuthStore'
import { useCuidadoStore } from './useCuidadoStore'
import { generarPreguntas, mensajeDeError, type Metodo, type Pregunta } from '../lib/ai'

// Reemplaza a APP.session de docs/js (method/subject/topic/questionCount).
// "preguntas" queda disponible para Juego. "resultados" es lo que arma
// terminarJuego() (puerto de finishGame() en docs/js/screens/juego.js) para
// que Resultados lo consuma.

export const Q_MIN = 5
export const Q_MAX = 20

function clampQuestionCount(n: number): number {
  if (isNaN(n)) return Q_MIN
  return Math.max(Q_MIN, Math.min(Q_MAX, n))
}

interface Resultado {
  correct: number
  wrong: number
  total: number
  pct: number
  xpGanado: number
  racha: number
  rachaNueva: boolean
}

export interface HistorialEntry {
  materia: string
  tema: string
  actividad: string
  fecha: string
  porcentaje: number
  xp: number
}

function formatFecha(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Puerto de addHistorialEntry (docs/js/storage.js): invitado guarda en
// sessionStorage con tope de 10 (mismo tope que la cache local de la app
// vieja); cuenta real inserta en Supabase sin tope, como hoy.
async function agregarHistorial(userId: string, entry: HistorialEntry): Promise<void> {
  if (useAuthStore.getState().authMode === 'guest') {
    const hist = guestStorage.leer<HistorialEntry[]>(GUEST_KEYS.historial) ?? []
    hist.unshift(entry)
    guestStorage.guardar(GUEST_KEYS.historial, hist.slice(0, 10))
    return
  }
  const { error } = await supabase.from('historial').insert({
    user_id: userId,
    materia: entry.materia,
    tema: entry.tema,
    actividad: entry.actividad,
    porcentaje: entry.porcentaje,
    xp: entry.xp,
  })
  if (error) console.warn('[Supabase] historial.insert fallo:', error.message)
}

interface EstudioState {
  method: Metodo | null
  subject: string
  topic: string
  questionCount: number
  preguntas: Pregunta[] | null
  resultados: Resultado | null
  historial: HistorialEntry[]
  loading: boolean
  error: string | null
  setMethod: (method: Metodo) => void
  setSubject: (subject: string) => void
  setTopic: (topic: string) => void
  nudgeCount: (delta: number) => void
  generate: () => Promise<{ ok: boolean }>
  terminarJuego: (correct: number, wrong: number, score: number) => Promise<void>
  nuevoTema: () => void
  cargarHistorial: (userId: string) => Promise<void>
  borrarHistorial: () => void
}

export const useEstudioStore = create<EstudioState>((set, get) => ({
  method: null,
  subject: '',
  topic: '',
  questionCount: Q_MIN,
  preguntas: null,
  resultados: null,
  historial: [],
  loading: false,
  error: null,

  setMethod: (method) => set({ method }),
  setSubject: (subject) => set({ subject }),
  setTopic: (topic) => set({ topic }),
  nudgeCount: (delta) => set({ questionCount: clampQuestionCount(get().questionCount + delta) }),

  generate: async () => {
    const { method, subject, topic, questionCount } = get()
    if (!method || !subject.trim() || !topic.trim()) {
      set({ error: 'Completa la materia y el tema' })
      return { ok: false }
    }

    set({ loading: true, error: null })
    try {
      const preguntas = await generarPreguntas(method, subject, topic, clampQuestionCount(questionCount))
      set({ loading: false, preguntas })
      return { ok: true }
    } catch (err) {
      set({ loading: false, error: mensajeDeError(err) })
      return { ok: false }
    }
  },

  // Puerto fiel de finishGame() (docs/js/screens/juego.js): calcula xpGanado,
  // suma XP/nivel/racha/sesion (useAuthStore.earnXp), alimenta a Mindy +15
  // (useCuidadoStore.alimentar), inserta en historial, y arma el resumen.
  terminarJuego: async (correct, wrong, score) => {
    const { method, subject, topic, preguntas } = get()
    const total = preguntas?.length ?? 0
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const xpGanado = method === 'rapid' ? score : correct * 10 + (pct >= 80 ? 20 : 0)

    const { streak, rachaNueva } = await useAuthStore.getState().earnXp(xpGanado)

    const userId = useAuthStore.getState().profile?.id
    if (userId) {
      await useCuidadoStore.getState().alimentar(userId, 15)
      await agregarHistorial(userId, {
        materia: subject,
        tema: topic,
        actividad: method ?? '',
        fecha: formatFecha(new Date()),
        porcentaje: pct,
        xp: xpGanado,
      })
    }

    set({ resultados: { correct, wrong, total, pct, xpGanado, racha: streak, rachaNueva } })
  },

  // Puerto de nuevoTema() (docs/js/screens/resultados.js): limpia
  // metodo/materia/tema/preguntas, mantiene questionCount.
  nuevoTema: () => set({ method: null, subject: '', topic: '', preguntas: null, resultados: null, error: null }),

  // Puerto de fetchHistorialFromSupabase()/getHistorial() (docs/js/storage.js):
  // invitado lee directo de sessionStorage (ya cachea las ultimas 10 en
  // agregarHistorial); cuenta real lee de Supabase ordenado por fecha, tope 10.
  cargarHistorial: async (userId) => {
    if (useAuthStore.getState().authMode === 'guest') {
      const hist = guestStorage.leer<HistorialEntry[]>(GUEST_KEYS.historial) ?? []
      set({ historial: hist })
      return
    }
    const { data, error } = await supabase
      .from('historial')
      .select('materia, tema, actividad, porcentaje, xp, fecha')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(10)
    if (error) {
      console.warn('[Supabase] historial.select fallo:', error.message)
      return
    }
    set({
      historial: (data ?? []).map((row) => ({
        materia: row.materia,
        tema: row.tema,
        actividad: row.actividad,
        fecha: formatFecha(new Date(row.fecha)),
        porcentaje: row.porcentaje,
        xp: row.xp,
      })),
    })
  },

  // Puerto de clearHistorial() (docs/js/storage.js): solo limpia el cache
  // local/estado en memoria, nunca borra las filas ya insertadas en Supabase.
  borrarHistorial: () => {
    if (useAuthStore.getState().authMode === 'guest') {
      guestStorage.guardar(GUEST_KEYS.historial, [])
    }
    set({ historial: [] })
  },
}))
