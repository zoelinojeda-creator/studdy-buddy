import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Columnas reales de la tabla 'usuarios' (confirmadas en docs/js/storage.js).
export interface UserProfile {
  id: string
  username: string
  avatar: string
  xp: number
  level: number
  sessions: number
  streak: number
}

interface AuthState {
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  init: () => void
  login: (email: string, password: string) => Promise<void>
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
