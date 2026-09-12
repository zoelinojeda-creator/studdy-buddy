import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'
import type { Item, Necesidad } from '../data/items'

// Persistencia: reusa mascota_estado (igual que useRoperoStore).
//
// - hunger (integer, columna existente): es "alimentacion" — la misma
//   necesidad que el hambre de la app vieja, mismo rango 0-100. No creamos
//   una copia paralela: ambas apps leen/escriben el mismo numero, tal como
//   ya conviven hoy distintos dispositivos con la app vieja.
// - diversion / descanso / higiene (integer, columnas NUEVAS): exclusivas
//   de este frontend, la app vieja no las conoce.
// - needs_calc_at (timestamptz, columna NUEVA): momento del ultimo calculo
//   de decay, igual en espiritu a lastHungerAt en docs/js/storage.js (que
//   ahi vive solo en localStorage). No tocamos outfit/owned_outfits/
//   equipped_head.

// Copia de GOAL_MS (docs/js/data.js) — duracion total para que, sin cuidar
// a Mindy, una necesidad con multiplicador 1x baje de 100 a 0.
const GOAL_MS: Record<string, number> = {
  casual: 24 * 60 * 60 * 1000,
  normal: 6 * 60 * 60 * 1000,
  intenso: 2 * 60 * 60 * 1000,
  extremo: 20 * 60 * 1000,
}

// Velocidad de cada necesidad relativa a la meta diaria. alimentacion = 1x
// mantiene exactamente el ritmo del hambre actual.
const NEED_MULTIPLIER: Record<Necesidad, number> = {
  alimentacion: 1,
  diversion: 0.75,
  descanso: 0.6,
  higiene: 0.5,
}

const NECESIDADES: Necesidad[] = ['alimentacion', 'diversion', 'descanso', 'higiene']

type Valores = Record<Necesidad, number>

function clampNeed(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

// Misma logica que applyHungerDecay en docs/js/storage.js: baja proporcional
// al tiempo real transcurrido desde el ultimo calculo, no a un temporizador.
function decayValores(valores: Valores, goal: string, needsCalcAt: number | null): Valores {
  if (needsCalcAt == null) return valores
  const elapsed = Date.now() - needsCalcAt
  if (elapsed <= 0) return valores
  const duration = GOAL_MS[goal] || GOAL_MS.normal
  const next = { ...valores }
  for (const necesidad of NECESIDADES) {
    const drop = (elapsed / duration) * NEED_MULTIPLIER[necesidad] * 100
    next[necesidad] = clampNeed(next[necesidad] - drop)
  }
  return next
}

// Defaults de docs/js/storage.js — solo se usan si la fila mascota_estado
// todavia no existe, para que la app vieja encuentre un estado valido.
const LEGACY_DEFAULTS = { outfit: 'none', daily_goal: 'normal' }

async function persist(userId: string, valores: Valores) {
  const payload: Record<string, unknown> = {
    user_id: userId,
    hunger: clampNeed(valores.alimentacion),
    diversion: clampNeed(valores.diversion),
    descanso: clampNeed(valores.descanso),
    higiene: clampNeed(valores.higiene),
    needs_calc_at: new Date().toISOString(),
  }
  const { data: existing } = await supabase
    .from('mascota_estado')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (!existing) Object.assign(payload, LEGACY_DEFAULTS)

  const { error } = await supabase.from('mascota_estado').upsert(payload, { onConflict: 'user_id' })
  if (error) console.warn('[Supabase] mascota_estado.upsert (needs) fallo:', error.message)
}

interface CuidadoState {
  loading: boolean
  error: string | null
  loaded: boolean
  valores: Valores
  goal: string
  needsCalcAt: number | null
  loadState: (userId: string) => Promise<void>
  useItem: (userId: string, item: Item) => Promise<{ ok: boolean; error?: string }>
}

export const useCuidadoStore = create<CuidadoState>((set, get) => ({
  loading: false,
  error: null,
  loaded: false,
  valores: { alimentacion: 100, diversion: 100, descanso: 100, higiene: 100 },
  goal: 'normal',
  needsCalcAt: null,

  loadState: async (userId) => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('mascota_estado')
      .select('hunger, diversion, descanso, higiene, daily_goal, needs_calc_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      // PGRST116 = no existe fila todavia (usuario nuevo); no es un error real.
      if (error.code === 'PGRST116') {
        set({
          loading: false,
          loaded: true,
          valores: { alimentacion: 75, diversion: 100, descanso: 100, higiene: 100 },
          goal: 'normal',
          needsCalcAt: null,
        })
        return
      }
      set({ loading: false, error: error.message })
      return
    }

    const goal = data.daily_goal || 'normal'
    const needsCalcAt = data.needs_calc_at ? new Date(data.needs_calc_at).getTime() : null
    const base: Valores = {
      alimentacion: data.hunger ?? 75,
      diversion: data.diversion ?? 100,
      descanso: data.descanso ?? 100,
      higiene: data.higiene ?? 100,
    }
    const decayed = decayValores(base, goal, needsCalcAt)

    set({ loading: false, loaded: true, valores: decayed, goal, needsCalcAt: Date.now() })
    await persist(userId, decayed)
  },

  useItem: async (userId, item) => {
    const { valores, goal, needsCalcAt } = get()
    const decayed = decayValores(valores, goal, needsCalcAt)

    const spent = await useAuthStore.getState().spendXp(item.precio)
    if (!spent) return { ok: false, error: 'No tenes suficiente XP' }

    const next: Valores = {
      ...decayed,
      [item.necesidad]: clampNeed(decayed[item.necesidad] + item.recupera),
    }
    set({ valores: next, needsCalcAt: Date.now() })
    await persist(userId, next)
    return { ok: true }
  },
}))
