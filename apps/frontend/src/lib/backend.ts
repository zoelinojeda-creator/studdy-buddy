import { supabase } from './supabase'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

// Primera vez que el frontend le habla al backend NestJS (hasta ahora todo
// era directo a Supabase). Adjunta el JWT de la sesion actual como Bearer
// token — es lo que SupabaseAuthGuard espera del lado del backend.
//
// accessToken es opcional: se usa cuando el caller ya tiene un token fresco
// en mano (p.ej. signUp() recien resuelto) y no quiere depender de que
// supabase.auth.getSession() ya haya sincronizado el estado interno del
// cliente en ese instante exacto — getSession() sigue siendo el default
// para todo lo demas, donde la sesion ya esta asentada hace rato.
export async function backendFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  if (!BACKEND_URL) {
    throw new Error('Falta la variable de entorno VITE_BACKEND_URL (revisa apps/frontend/.env)')
  }
  const token = accessToken ?? (await supabase.auth.getSession()).data.session?.access_token

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
