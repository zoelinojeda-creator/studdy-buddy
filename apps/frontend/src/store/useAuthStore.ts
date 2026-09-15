import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { backendFetch } from '../lib/backend'

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

interface AuthState {
  session: Session | null
  profile: UserProfile | null
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
  logout: () => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  updateProfile: (updates: Partial<Pick<UserProfile, 'username' | 'avatar'>>) => Promise<void>
  spendXp: (amount: number) => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: false,
  error: null,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session })
      if (data.session) get().loadProfile(data.session.user.id)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
      if (session) {
        get().loadProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ loading: false, error: error.message })
      return
    }
    set({ session: data.session, loading: false })
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

    set({ session })
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
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },

  loadProfile: async (userId) => {
    const { data, error } = await supabase.from('usuarios').select('*').eq('id', userId).single()
    if (error) {
      set({ error: error.message })
      return
    }
    set({ profile: data as UserProfile })
  },

  updateProfile: async (updates) => {
    const { profile } = get()
    if (!profile) return
    set({ loading: true, error: null })
    const { error } = await supabase.from('usuarios').update(updates).eq('id', profile.id)
    if (error) {
      set({ loading: false, error: error.message })
      return
    }
    set({ profile: { ...profile, ...updates }, loading: false })
  },

  // Descuenta XP (compras del Ropero, etc.). Devuelve false si no alcanza el saldo.
  spendXp: async (amount) => {
    const { profile } = get()
    if (!profile) return false
    if (profile.xp < amount) return false
    const newXp = profile.xp - amount
    const { error } = await supabase.from('usuarios').update({ xp: newXp }).eq('id', profile.id)
    if (error) {
      set({ error: error.message })
      return false
    }
    set({ profile: { ...profile, xp: newXp } })
    return true
  },
}))
