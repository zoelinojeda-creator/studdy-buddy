// Tipos compartidos entre apps/frontend y apps/backend para la funcionalidad
// de aulas/profesores. NO esta importado todavia desde ninguna de las dos
// apps (ver nota abajo) — por ahora es la fuente de verdad de referencia
// que cada lado replica localmente, mismo patron que UserProfile en
// apps/frontend/src/store/useAuthStore.ts.
//
// Por que no esta conectado como dependencia real todavia: este paquete no
// tiene paso de build (su package.json apunta "main"/"types" directo a
// este .ts), y ninguna de las dos apps lo importo nunca hasta ahora. Sin
// poder correr npm/tsc en este entorno para confirmarlo, no es seguro
// asumir que apps/backend (compilado con tsc/nest build, con su propio
// rootDir) va a resolver un .ts fuera de su carpeta sin errores — es un
// problema conocido de monorepos sin project references o un build previo
// del paquete compartido. Cuando alguien lo pueda probar en un entorno
// real, conectarlo es tan simple como agregar "@studybuddy/types" como
// dependencia en ambos package.json e importar desde aca.

export type Rol = 'alumno' | 'profesor'

export interface Aula {
  id: string
  nombre: string
  codigo: string
  profesorId: string
  createdAt: string
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

export interface CrearAulaInput {
  nombre: string
}

export interface UnirseAulaInput {
  codigo: string
}
