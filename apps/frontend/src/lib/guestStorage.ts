// Helper minimo para el modo invitado: solo saca el ceremonial de
// JSON.parse/stringify + try/catch de sessionStorage a un lugar comun. NO es
// un "adapter" que decide logica de negocio — cada store sigue siendo dueño
// de su propio shape y de cuando leer/escribir. Todo vive en sessionStorage
// (a diferencia de docs/js, que mezcla sessionStorage para el perfil y
// localStorage para mindy) para que el comportamiento sea uniforme y
// predecible: se pierde entero al cerrar la pestaña.

export const GUEST_KEYS = {
  perfil: 'sb_guest_perfil',
  ropero: 'sb_guest_ropero',
  cuidado: 'sb_guest_cuidado',
  historial: 'sb_guest_historial',
} as const

function leer<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function guardar(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // sessionStorage no disponible (modo privado, etc.) — el invitado
    // sigue funcionando en memoria durante la sesion, solo no persiste.
  }
}

function limpiarTodo(): void {
  for (const key of Object.values(GUEST_KEYS)) {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // noop
    }
  }
}

export const guestStorage = { leer, guardar, limpiarTodo }
