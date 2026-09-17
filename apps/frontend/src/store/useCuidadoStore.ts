import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './useAuthStore'
import { guestStorage, GUEST_KEYS } from '../lib/guestStorage'
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
//
// "changed" indica si el redondeo a entero produjo un cambio real en al
// menos una necesidad. Bug real detectado: si cada sesion es corta (el drop
// calculado es menor a 0.5), Math.round lo devuelve al mismo entero de
// siempre y esa fraccion se pierde para siempre — el numero nunca se mueve
// aunque pase tiempo real de sobra en total. El caller usa "changed" para
// decidir si conviene avanzar needs_calc_at (si no cambio nada, se deja el
// ancla vieja intacta para que el proximo calculo seguir sumando desde ahi,
// en vez de reiniciar el reloj y perder ese tiempo acumulado).
function decayValores(
  valores: Valores,
  goal: string,
  needsCalcAt: number | null,
): { valores: Valores; changed: boolean } {
  if (needsCalcAt == null) return { valores, changed: false }
  const elapsed = Date.now() - needsCalcAt
  if (elapsed <= 0) return { valores, changed: false }
  const duration = GOAL_MS[goal] || GOAL_MS.normal
  const next = { ...valores }
  let changed = false
  for (const necesidad of NECESIDADES) {
    const drop = (elapsed / duration) * NEED_MULTIPLIER[necesidad] * 100
    const nuevo = clampNeed(next[necesidad] - drop)
    if (nuevo !== next[necesidad]) changed = true
    next[necesidad] = nuevo
  }
  return { valores: next, changed }
}

// Defaults de docs/js/storage.js — solo se usan si la fila mascota_estado
// todavia no existe, para que la app vieja encuentre un estado valido.
const LEGACY_DEFAULTS = { outfit: 'none', daily_goal: 'normal' }

interface CuidadoInvitado {
  valores: Valores
  goal: string
  needsCalcAt: number | null
}

function leerInvitado(): CuidadoInvitado {
  return (
    guestStorage.leer<CuidadoInvitado>(GUEST_KEYS.cuidado) ?? {
      valores: { alimentacion: 75, diversion: 100, descanso: 100, higiene: 100 },
      goal: 'normal',
      needsCalcAt: null,
    }
  )
}

function guardarInvitado(estado: CuidadoInvitado): void {
  guestStorage.guardar(GUEST_KEYS.cuidado, estado)
}

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
  alimentar: (userId: string, cantidad: number) => Promise<void>
}

export const useCuidadoStore = create<CuidadoState>((set, get) => ({
  loading: false,
  error: null,
  loaded: false,
  valores: { alimentacion: 100, diversion: 100, descanso: 100, higiene: 100 },
  goal: 'normal',
  needsCalcAt: null,

  loadState: async (userId) => {
    if (useAuthStore.getState().authMode === 'guest') {
      const { valores, goal, needsCalcAt } = leerInvitado()
      const { valores: decayed, changed } = decayValores(valores, goal, needsCalcAt)
      const debeAnclar = changed || needsCalcAt == null
      const nuevoNeedsCalcAt = debeAnclar ? Date.now() : needsCalcAt
      set({ loading: false, loaded: true, valores: decayed, goal, needsCalcAt: nuevoNeedsCalcAt })
      if (debeAnclar) guardarInvitado({ valores: decayed, goal, needsCalcAt: nuevoNeedsCalcAt })
      return
    }

    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('mascota_estado')
      .select('hunger, diversion, descanso, higiene, daily_goal, needs_calc_at')
      .eq('user_id', userId)
      .single()

    if (error) {
      // PGRST116 = no existe fila todavia (usuario nuevo). Antes esto solo
      // seteaba el estado en memoria sin persistir — una cuenta que nunca
      // compra/usa nada se quedaba sin fila para siempre. Ahora se crea la
      // fila con los defaults y un needs_calc_at real desde el primer momento.
      if (error.code === 'PGRST116') {
        const defaults: Valores = { alimentacion: 75, diversion: 100, descanso: 100, higiene: 100 }
        set({ loading: false, loaded: true, valores: defaults, goal: 'normal', needsCalcAt: Date.now() })
        await persist(userId, defaults)
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
    const { valores: decayed, changed } = decayValores(base, goal, needsCalcAt)
    const debeAnclar = changed || needsCalcAt == null
    const nuevoNeedsCalcAt = debeAnclar ? Date.now() : needsCalcAt

    set({ loading: false, loaded: true, valores: decayed, goal, needsCalcAt: nuevoNeedsCalcAt })
    if (debeAnclar) await persist(userId, decayed)
  },

  useItem: async (userId, item) => {
    const { valores, goal, needsCalcAt } = get()
    const { valores: decayed } = decayValores(valores, goal, needsCalcAt)

    const spent = await useAuthStore.getState().spendXp(item.precio)
    if (!spent) return { ok: false, error: 'No tenes suficiente XP' }

    const next: Valores = {
      ...decayed,
      [item.necesidad]: clampNeed(decayed[item.necesidad] + item.recupera),
    }
    set({ valores: next, needsCalcAt: Date.now() })

    if (useAuthStore.getState().authMode === 'guest') {
      guardarInvitado({ valores: next, goal, needsCalcAt: Date.now() })
      return { ok: true }
    }

    await persist(userId, next)
    return { ok: true }
  },

  // Puerto de feedMindy(15) llamado por finishGame() al terminar el juego —
  // gemelo de useItem() pero sin gastar XP (es un premio, no una compra).
  alimentar: async (userId, cantidad) => {
    const { valores, goal, needsCalcAt } = get()
    const { valores: decayed } = decayValores(valores, goal, needsCalcAt)
    const next: Valores = { ...decayed, alimentacion: clampNeed(decayed.alimentacion + cantidad) }
    set({ valores: next, needsCalcAt: Date.now() })

    if (useAuthStore.getState().authMode === 'guest') {
      guardarInvitado({ valores: next, goal, needsCalcAt: Date.now() })
      return
    }

    await persist(userId, next)
  },
}))
