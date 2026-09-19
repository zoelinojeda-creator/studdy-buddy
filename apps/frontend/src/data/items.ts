// Items para recuperar las necesidades de Mindy en la pantalla Cuidado.
// "alimentacion" replica exactamente FOOD_ITEMS de docs/js/data.js (mismos
// precios y recuperacion) porque es la misma necesidad que el "hambre" de
// la app vieja. diversion/descanso/higiene son items nuevos, calibrados
// con el mismo ratio precio/recuperacion (~0.8-0.9 XP por punto).

export type Necesidad = 'alimentacion' | 'diversion' | 'descanso' | 'higiene'

// Compartido entre Mascota (barras de necesidad) y Cuidado (titulos de
// seccion de la lista de items) para no duplicar el mismo mapa dos veces.
export const NECESIDAD_LABEL: Record<Necesidad, { nombre: string; icono: string }> = {
  alimentacion: { nombre: 'Alimentación', icono: '🍽️' },
  diversion: { nombre: 'Diversión', icono: '🎈' },
  descanso: { nombre: 'Descanso', icono: '🛌' },
  higiene: { nombre: 'Higiene', icono: '🧴' },
}

export interface Item {
  id: string
  nombre: string
  icono: string
  necesidad: Necesidad
  precio: number
  recupera: number
}

export const ITEMS: Item[] = [
  // ===== ALIMENTACION (= FOOD_ITEMS de docs/js/data.js) =====
  { id: 'apple', nombre: 'Manzana', icono: '🍎', necesidad: 'alimentacion', precio: 10, recupera: 15 },
  { id: 'burger', nombre: 'Hamburguesa', icono: '🍔', necesidad: 'alimentacion', precio: 25, recupera: 30 },
  { id: 'pizza', nombre: 'Pizza', icono: '🍕', necesidad: 'alimentacion', precio: 40, recupera: 45 },
  { id: 'cake', nombre: 'Torta', icono: '🎂', necesidad: 'alimentacion', precio: 60, recupera: 60 },
  { id: 'sushi', nombre: 'Sushi', icono: '🍣', necesidad: 'alimentacion', precio: 80, recupera: 75 },
  { id: 'ramen', nombre: 'Ramen', icono: '🍜', necesidad: 'alimentacion', precio: 100, recupera: 100 },

  // ===== DIVERSION =====
  { id: 'board-game', nombre: 'Juego de mesa', icono: '🎲', necesidad: 'diversion', precio: 25, recupera: 30 },
  { id: 'videogame', nombre: 'Videojuegos', icono: '🎮', necesidad: 'diversion', precio: 55, recupera: 60 },

  // ===== DESCANSO =====
  { id: 'nap', nombre: 'Siesta', icono: '😴', necesidad: 'descanso', precio: 25, recupera: 30 },
  { id: 'bath', nombre: 'Baño relajante', icono: '🛁', necesidad: 'descanso', precio: 58, recupera: 60 },

  // ===== HIGIENE =====
  { id: 'quick-wash', nombre: 'Lavado rápido', icono: '🧼', necesidad: 'higiene', precio: 22, recupera: 30 },
  { id: 'shower', nombre: 'Ducha completa', icono: '🚿', necesidad: 'higiene', precio: 50, recupera: 60 },
]
