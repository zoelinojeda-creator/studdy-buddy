import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'
import { guestStorage, GUEST_KEYS } from '../lib/guestStorage'
import { ACCESSORIES, type Accessory } from '../data/accessories'

// Persistencia: reusa la tabla mascota_estado ya usada por docs/ (app vieja).
//
// - owned_outfits (jsonb, columna existente): array plano de ids comprados.
//   La app vieja guarda ahi sus propios ids (hat, crown, glasses, bow, cape, none)
//   y solo AGREGA ids, nunca los valida contra una whitelist ni los borra
//   (ver normalizeOwnedOutfits en docs/js/storage.js). Los ids nuevos
//   (hat-*, shirt-*) conviven ahi sin problema porque no colisionan con los viejos.
//   Por eso guardamos el array completo (rawOwnedOutfits) y solo derivamos/
//   filtramos localmente los que pertenecen al catalogo nuevo.
// - equipped_head (text, columna NUEVA, agregada solo para este frontend):
//   guarda el unico accesorio equipado. La app vieja no la conoce ni la
//   toca. No tocamos la columna vieja "outfit" para no pisar lo que la
//   tienda vieja escribe ahi. equipped_body quedo sin uso (un solo slot).

const accessoryById = (id: string): Accessory | undefined => ACCESSORIES.find((a) => a.id === id)

interface RoperoInvitado {
  rawOwnedOutfits: string[]
  equippedAccessory: string | null
}

function leerInvitado(): RoperoInvitado {
  return guestStorage.leer<RoperoInvitado>(GUEST_KEYS.ropero) ?? { rawOwnedOutfits: [], equippedAccessory: null }
}

function guardarInvitado(estado: RoperoInvitado): void {
  guestStorage.guardar(GUEST_KEYS.ropero, estado)
}

interface RoperoState {
  loading: boolean
  error: string | null
  loaded: boolean
  rawOwnedOutfits: string[]
  equippedAccessory: string | null
  ownedAccessoryIds: () => string[]
  isOwned: (id: string) => boolean
  loadState: (userId: string) => Promise<void>
  buyAccessory: (userId: string, id: string) => Promise<{ ok: boolean; error?: string }>
  equipAccessory: (userId: string, id: string) => Promise<boolean>
  unequipAccessory: (userId: string) => Promise<void>
}

// Valores por defecto de docs/js/storage.js — se usan solo si la fila
// mascota_estado todavia no existe, para que si el usuario abre la app
// vieja despues encuentre un estado valido en vez de columnas nulas.
const LEGACY_DEFAULTS = { hunger: 75, outfit: 'none', daily_goal: 'normal' }

export const useRoperoStore = create<RoperoState>((set, get) => ({
  loading: false,
  error: null,
  loaded: false,
  rawOwnedOutfits: [],
  equippedAccessory: null,

  ownedAccessoryIds: () => get().rawOwnedOutfits.filter((id) => !!accessoryById(id)),
  isOwned: (id) => get().rawOwnedOutfits.includes(id),

  loadState: async (userId) => {
    if (useAuthStore.getState().authMode === 'guest') {
      const estado = leerInvitado()
      set({ loading: false, loaded: true, ...estado })
      return
    }

    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('mascota_estado')
      .select('owned_outfits, equipped_head')
      .eq('user_id', userId)
      .single()

    if (error) {
      // PGRST116 = no existe fila todavia (usuario nuevo en el ropero). Antes
      // esto solo seteaba el estado en memoria sin persistir — una cuenta
      // que nunca compra nada se quedaba sin fila para siempre (mismo bug
      // que tenia useCuidadoStore). Ahora se crea la fila con los defaults.
      if (error.code === 'PGRST116') {
        const { error: upsertError } = await supabase
          .from('mascota_estado')
          .upsert({ user_id: userId, owned_outfits: [], ...LEGACY_DEFAULTS }, { onConflict: 'user_id' })
        if (upsertError) console.warn('[Supabase] mascota_estado.upsert (ropero init) fallo:', upsertError.message)
        set({ loading: false, loaded: true, rawOwnedOutfits: [], equippedAccessory: null })
        return
      }
      set({ loading: false, error: error.message })
      return
    }

    set({
      loading: false,
      loaded: true,
      rawOwnedOutfits: Array.isArray(data.owned_outfits) ? data.owned_outfits : [],
      equippedAccessory: data.equipped_head ?? null,
    })
  },

  buyAccessory: async (userId, id) => {
    const accessory = accessoryById(id)
    if (!accessory) return { ok: false, error: 'Accesorio inexistente' }
    if (get().isOwned(id)) return { ok: true }

    const spent = await useAuthStore.getState().spendXp(accessory.precio)
    if (!spent) return { ok: false, error: 'No tenes suficiente XP' }

    const nextOwned = [...get().rawOwnedOutfits, id]

    if (useAuthStore.getState().authMode === 'guest') {
      guardarInvitado({ rawOwnedOutfits: nextOwned, equippedAccessory: get().equippedAccessory })
      set({ rawOwnedOutfits: nextOwned })
      return { ok: true }
    }

    const payload: Record<string, unknown> = { user_id: userId, owned_outfits: nextOwned }
    // Si la fila nunca existio, la creamos con defaults validos para la app vieja.
    const { data: existing } = await supabase
      .from('mascota_estado')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()
    if (!existing) Object.assign(payload, LEGACY_DEFAULTS)

    const { error } = await supabase.from('mascota_estado').upsert(payload, { onConflict: 'user_id' })
    if (error) return { ok: false, error: error.message }

    set({ rawOwnedOutfits: nextOwned })
    return { ok: true }
  },

  equipAccessory: async (userId, id) => {
    if (!get().isOwned(id)) return false

    if (useAuthStore.getState().authMode === 'guest') {
      guardarInvitado({ rawOwnedOutfits: get().rawOwnedOutfits, equippedAccessory: id })
      set({ equippedAccessory: id })
      return true
    }

    const { error } = await supabase
      .from('mascota_estado')
      .upsert({ user_id: userId, equipped_head: id }, { onConflict: 'user_id' })
    if (error) {
      set({ error: error.message })
      return false
    }
    set({ equippedAccessory: id })
    return true
  },

  unequipAccessory: async (userId) => {
    if (useAuthStore.getState().authMode === 'guest') {
      guardarInvitado({ rawOwnedOutfits: get().rawOwnedOutfits, equippedAccessory: null })
      set({ equippedAccessory: null })
      return
    }

    const { error } = await supabase
      .from('mascota_estado')
      .upsert({ user_id: userId, equipped_head: null }, { onConflict: 'user_id' })
    if (error) {
      set({ error: error.message })
      return
    }
    set({ equippedAccessory: null })
  },
}))
