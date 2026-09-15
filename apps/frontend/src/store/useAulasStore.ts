import { create } from 'zustand'
import { backendFetch } from '../lib/backend'

// Todo esto pasa por apps/backend (NestJS), no directo a Supabase: un
// profesor necesita ver datos de otros usuarios (sus alumnos), y esa
// autorizacion no se resuelve con RLS solo. Ver diseño de aulas/profesores.

export interface Aula {
  id: string
  nombre: string
  codigo: string
  created_at: string
}

export interface AulaConProfesor {
  id: string
  nombre: string
  codigo: string
  profesorUsername: string
}

export interface AlumnoDeAula {
  alumnoId: string
  username: string
  avatar: string
  xp: number
  level: number
  streak: number
  actividadesCompletadas: number
}

export interface RankingEntry {
  posicion: number
  alumnoId: string
  username: string
  avatar: string
  racha: number
  nivel: number
  xpGanado: number
  puntaje: number
}

interface AulasState {
  loading: boolean
  error: string | null
  misAulas: Aula[]
  misAulasAlumno: AulaConProfesor[]
  alumnosPorAula: Record<string, AlumnoDeAula[]>
  rankingPorAula: Record<string, RankingEntry[]>
  cargarMisAulas: () => Promise<void>
  crearAula: (nombre: string) => Promise<{ ok: boolean; error?: string }>
  cargarMisAulasAlumno: () => Promise<void>
  unirseAula: (codigo: string) => Promise<{ ok: boolean; error?: string }>
  cargarAlumnosDeAula: (aulaId: string) => Promise<void>
  cargarRanking: (aulaId: string) => Promise<void>
}

export const useAulasStore = create<AulasState>((set, get) => ({
  loading: false,
  error: null,
  misAulas: [],
  misAulasAlumno: [],
  alumnosPorAula: {},
  rankingPorAula: {},

  cargarMisAulas: async () => {
    set({ loading: true, error: null })
    try {
      const aulas = await backendFetch<Aula[]>('/aulas/mias')
      set({ loading: false, misAulas: aulas })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'No se pudieron cargar las aulas' })
    }
  },

  crearAula: async (nombre) => {
    try {
      const aula = await backendFetch<Aula>('/aulas', { method: 'POST', body: JSON.stringify({ nombre }) })
      set({ misAulas: [aula, ...get().misAulas] })
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'No se pudo crear el aula' }
    }
  },

  cargarMisAulasAlumno: async () => {
    set({ loading: true, error: null })
    try {
      const aulas = await backendFetch<AulaConProfesor[]>('/aulas/mias-alumno')
      set({ loading: false, misAulasAlumno: aulas })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'No se pudieron cargar las aulas' })
    }
  },

  unirseAula: async (codigo) => {
    try {
      await backendFetch('/aulas/unirse', { method: 'POST', body: JSON.stringify({ codigo }) })
      await get().cargarMisAulasAlumno()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'No se pudo unir al aula' }
    }
  },

  cargarAlumnosDeAula: async (aulaId) => {
    set({ loading: true, error: null })
    try {
      const alumnos = await backendFetch<AlumnoDeAula[]>(`/aulas/${aulaId}/alumnos`)
      set({ loading: false, alumnosPorAula: { ...get().alumnosPorAula, [aulaId]: alumnos } })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'No se pudieron cargar los alumnos' })
    }
  },

  cargarRanking: async (aulaId) => {
    set({ loading: true, error: null })
    try {
      const ranking = await backendFetch<RankingEntry[]>(`/aulas/${aulaId}/ranking`)
      set({ loading: false, rankingPorAula: { ...get().rankingPorAula, [aulaId]: ranking } })
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : 'No se pudo cargar el ranking' })
    }
  },
}))
