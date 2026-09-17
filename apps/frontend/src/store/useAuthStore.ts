import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { backendFetch } from '../lib/backend'
import { guestStorage, GUEST_KEYS } from '../lib/guestStorage'

// Columnas reales de la tabla 'usuarios' (confirmadas en docs/js/storage.js).
// "rol" es nueva (aulas/profesores) — toda cuenta existente la tiene en
// 'alumno' por el DEFAULT de la columna.
export interface UserProfile {
  id: string
  username: string
  avatar: string
  xp: number
  level: number
  sessions: number
  streak: number
  rol: 'alumno' | 'profesor'
  // Bookkeeping interno para calcular la racha (docs/js/storage.js
  // updateStreak) — nunca se muestra en UI. A diferencia de la app vieja
  // (que la guarda solo en localStorage), acá vive en Supabase tambien,
  // porque profile.streak si esta sincronizado entre dispositivos y
  // calcularlo contra una fecha solo local rompería esa sincronizacion.
  lastStreakDate?: string
}

// signUp() puede devolver session: null aunque el registro haya funcionado
// bien — pasa cuando GoTrue todavia no ve el email confirmado en el
// instante exacto de esa respuesta (el trigger auto_confirm_email corre
// milisegundos despues, server-side, sin relacion con esta request). No hay
// forma de "esperar mas" sobre la misma llamada a signUp() una vez que ya
// respondio sin sesion — reintentamos login, que si evalua el estado fresco.
async function reintentarLoginTrasConfirmacion(email: string, password: string): Promise<Session | null> {
  const esperas = [300, 600, 1200]
  for (const espera of esperas) {
    await new Promise((resolve) => setTimeout(resolve, espera))
    const { data } = await supabase.auth.signInWithPassword({ email, password })
    if (data.session) return data.session
  }
  return null
}

// Puerto exacto de localDateKey/daysBetweenKeys (docs/js/storage.js).
function localDateKey(d: Date = new Date()): string {
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${d.getFullYear()}-${m < 10 ? '0' : ''}${m}-${day < 10 ? '0' : ''}${day}`
}

function daysBetweenKeys(fromKey: string, toKey: string): number | null {
  const a = (fromKey || '').split('-')
  const b = (toKey || '').split('-')
  if (a.length !== 3 || b.length !== 3) return null
  const da = new Date(+a[0], +a[1] - 1, +a[2])
  const db = new Date(+b[0], +b[1] - 1, +b[2])
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export type AuthMode = 'supabase' | 'guest' | null

// Perfil inicial del invitado — mismos valores que docs/js/screens/inicio.js
// doGuest() (username 'Invitado', avatar 'invitado', xp 0, level 1,
// sessions 1, streak 0). id es una constante fija: no hay UUID real, y nada
// en el modo invitado necesita escribir contra Supabase con ese id.
function perfilInvitadoInicial(): UserProfile {
  return { id: 'guest', username: 'Invitado', avatar: 'invitado', xp: 0, level: 1, sessions: 1, streak: 0, rol: 'alumno' }
}

interface AuthState {
  session: Session | null
  profile: UserProfile | null
  authMode: AuthMode
  loading: boolean
  error: string | null
  init: () => void
  login: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    username: string,
    avatar: string,
    rol: 'alumno' | 'profesor',
  ) => Promise<void>
  loginAsGuest: () => void
  logout: () => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'username' | 'avatar'>>) => Promise<void>
  spendXp: (amount: number) => Promise<boolean>
  earnXp: (amount: number) => Promise<{ streak: number; rachaNueva: boolean }>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  authMode: null,
  loading: false,
  error: null,

  init: () => {
    // Si hay un invitado activo en esta pestaña, se restaura sync y sin red
    // (igual que bootstrapStorage() en docs/js) — no hace falta consultar
    // Supabase para saber que no hay sesion real en ese caso.
    const perfilInvitado = guestStorage.leer<UserProfile>(GUEST_KEYS.perfil)
    if (perfilInvitado) {
      set({ authMode: 'guest', session: null, profile: perfilInvitado })
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, authMode: data.session ? 'supabase' : null })
      if (data.session) get().loadProfile(data.session.user.id)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      // El invitado nunca dispara este listener (no usa supabase.auth) —
      // si hay authMode 'guest' activo, un evento de Supabase real (o su
      // ausencia) no debe pisarlo.
      if (get().authMode === 'guest') return
      set({ session, authMode: session ? 'supabase' : null })
      if (session) {
        get().loadProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  // Mismo dato inicial que docs/js/screens/inicio.js doGuest(), pero
  // guardado en sessionStorage en vez de en memoria de una app monolitica.
  loginAsGuest: () => {
    const perfil = perfilInvitadoInicial()
    guestStorage.guardar(GUEST_KEYS.perfil, perfil)
    guestStorage.guardar(GUEST_KEYS.ropero, { rawOwnedOutfits: [], equippedAccessory: null })
    guestStorage.guardar(GUEST_KEYS.cuidado, {
      valores: { alimentacion: 75, diversion: 100, descanso: 100, higiene: 100 },
      goal: 'normal',
      needsCalcAt: null,
    })
    set({ authMode: 'guest', session: null, profile: perfil })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ loading: false, error: error.message })
      return
    }
    set({ session: data.session, authMode: 'supabase', loading: false })
    if (data.session) await get().loadProfile(data.session.user.id)
  },

  // Registro nuevo (no existia en apps/frontend, solo en docs/js). La fila
  // en 'usuarios' la crea el mismo mecanismo que ya usa la app vieja al
  // hacer signUp (lee username/avatar de los metadatos) — no lo tocamos.
  // El rol nace 'alumno' (default de la columna); si se eligio 'profesor'
  // lo promovemos con una llamada al backend, valida solo porque la cuenta
  // todavia no tuvo ninguna sesion (lo hace cumplir un trigger en Postgres).
  signUp: async (email, password, username, avatar, rol) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, avatar } },
    })
    if (error) {
      set({ loading: false, error: error.message })
      return
    }

    let session = data.session
    if (!session) {
      session = await reintentarLoginTrasConfirmacion(email, password)
    }
    if (!session) {
      set({ loading: false, error: 'Cuenta creada. Iniciá sesión en unos segundos.' })
      return
    }

    set({ session, authMode: 'supabase' })
    if (rol === 'profesor') {
      try {
        await backendFetch(
          '/auth/rol',
          { method: 'POST', body: JSON.stringify({ rol: 'profesor' }) },
          session.access_token,
        )
      } catch (err) {
        set({ loading: false, error: err instanceof Error ? err.message : 'No se pudo asignar el rol' })
        return
      }
    }
    set({ loading: false })
    await get().loadProfile(session.user.id)
  },

  logout: async () => {
    if (get().authMode === 'guest') {
      guestStorage.limpiarTodo()
      set({ session: null, profile: null, authMode: null })
      return
    }
    await supabase.auth.signOut()
    set({ session: null, profile: null, authMode: null })
  },

  loadProfile: async (userId) => {
    // "*" no alcanza para last_streak_date: Postgres/PostgREST devuelve esa
    // columna con su nombre real (snake_case), no como lastStreakDate — se
    // pide con alias explicito para que el cast a UserProfile sea correcto.
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, username, avatar, xp, level, sessions, streak, rol, lastStreakDate:last_streak_date')
      .eq('id', userId)
      .single()
    if (error) {
      set({ error: error.message })
      return
    }
    set({ profile: data as unknown as UserProfile })
  },

  updateProfile: async (updates) => {
    const { profile, authMode } = get()
    if (!profile) return
    set({ loading: true, error: null })

    if (authMode === 'guest') {
      const next = { ...profile, ...updates }
      guestStorage.guardar(GUEST_KEYS.perfil, next)
      set({ profile: next, loading: false })
      return
    }

    const { error } = await supabase.from('usuarios').update(updates).eq('id', profile.id)
    if (error) {
      set({ loading: false, error: error.message })
      return
    }
    set({ profile: { ...profile, ...updates }, loading: false })
  },

  // Descuenta XP (compras del Ropero, etc.). Devuelve false si no alcanza el saldo.
  spendXp: async (amount) => {
    const { profile, authMode } = get()
    if (!profile) return false
    if (profile.xp < amount) return false
    const newXp = profile.xp - amount

    if (authMode === 'guest') {
      const next = { ...profile, xp: newXp }
      guestStorage.guardar(GUEST_KEYS.perfil, next)
      set({ profile: next })
      return true
    }

    const { error } = await supabase.from('usuarios').update({ xp: newXp }).eq('id', profile.id)
    if (error) {
      set({ error: error.message })
      return false
    }
    set({ profile: { ...profile, xp: newXp } })
    return true
  },

  // Puerto fiel de finishGame() (docs/js/screens/juego.js): suma XP, sube
  // de nivel con un solo chequeo (no un while — misma limitacion que la app
  // vieja: no se pueden saltar dos niveles de una), suma una sesion, y
  // actualiza la racha (updateStreak de docs/js/storage.js, puerto exacto).
  earnXp: async (amount) => {
    const { profile, authMode } = get()
    if (!profile) return { streak: 0, rachaNueva: false }

    let xp = profile.xp + amount
    let level = profile.level
    if (xp >= level * 100) {
      xp -= level * 100
      level++
    }
    const sessions = (profile.sessions || 0) + 1

    const today = localDateKey()
    const prevStreakDay = profile.lastStreakDate || ''
    let streak = profile.streak || 0
    let lastStreakDate = prevStreakDay
    if (prevStreakDay !== today) {
      const gap = prevStreakDay ? daysBetweenKeys(prevStreakDay, today) : null
      streak = gap === 1 ? streak + 1 : 1
      lastStreakDate = today
    }
    const rachaNueva = lastStreakDate !== prevStreakDay && streak > 0

    const next: UserProfile = { ...profile, xp, level, sessions, streak, lastStreakDate }

    if (authMode === 'guest') {
      guestStorage.guardar(GUEST_KEYS.perfil, next)
      set({ profile: next })
      return { streak, rachaNueva }
    }

    const { error } = await supabase
      .from('usuarios')
      .update({ xp, level, sessions, streak, last_streak_date: lastStreakDate })
      .eq('id', profile.id)
    if (error) {
      set({ error: error.message })
      return { streak: profile.streak, rachaNueva: false }
    }
    set({ profile: next })
    return { streak, rachaNueva }
  },
}))
