import type { ColumnType, Generated } from 'kysely';

// Esquema de tablas para Kysely. Se va poblando a medida que el backend
// gana logica de negocio real — hasta ahora solo aulas/profesores la usa.

export interface UsuariosTable {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  sessions: number;
  streak: number;
  // Columna agregada para aulas/profesores. Compatible hacia atras: toda
  // fila existente (creada por la app vieja) recibe 'alumno' via DEFAULT.
  rol: 'alumno' | 'profesor';
}

export interface AulasTable {
  id: Generated<string>;
  profesor_id: string;
  nombre: string;
  codigo: string;
  created_at: ColumnType<Date, never, never>;
}

export interface AulaMiembrosTable {
  id: Generated<string>;
  aula_id: string;
  alumno_id: string;
  joined_at: ColumnType<Date, never, never>;
  // XP del alumno en el momento de unirse — se completa siempre en el
  // insert (POST /aulas/unirse), nunca queda null. Sirve para calcular
  // "XP ganado en esta aula" = usuarios.xp actual - xp_inicial.
  xp_inicial: number;
}

export interface HistorialTable {
  // Solo se tipa lo que aulas/profesores necesita (contar actividades por
  // usuario). El resto de columnas de docs/js/storage.js no hacen falta aca.
  user_id: string;
}

export interface Database {
  usuarios: UsuariosTable;
  aulas: AulasTable;
  aula_miembros: AulaMiembrosTable;
  historial: HistorialTable;
}
