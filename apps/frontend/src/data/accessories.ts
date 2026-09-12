// Accesorios de Mindy — catalogo del Ropero.
// Cada accesorio es un SVG independiente con viewBox="0 0 120 130",
// pensado para dibujarse ENCIMA del SVG base de Mindy (mismo viewBox,
// mismo sistema de coordenadas) asi encajan sin ajustar nada.
//
// Los ids usan el prefijo hat- para no colisionar nunca con los ids del
// sistema viejo de docs/ (hat, crown, glasses, bow, cape).
//
// Precios calibrados contra OUTFIT_ITEMS de docs/js/data.js (hat 30, bow 40,
// glasses 50, crown 80, cape 120) para mantener la economia de XP coherente.

export interface Accessory {
  id: string
  nombre: string
  precio: number
  svgAtras?: string
  svgAdelante?: string
}

export const ACCESSORIES: Accessory[] = [
  {
    id: 'hat-band',
    nombre: 'Vincha',
    precio: 25,
    svgAdelante: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M25,27 Q60,15 95,27" fill="none" stroke="#f9c846" stroke-width="5" stroke-linecap="round"/>
  <circle cx="60" cy="18.5" r="4" fill="#6ee7b7" stroke="#1a7a52" stroke-width="1.2"/>
</svg>`,
  },
  {
    id: 'hat-cap',
    nombre: 'Gorra',
    precio: 35,
    svgAdelante: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M35,29 Q34,13 60,12 Q86,13 85,29 Q60,36 35,29 Z" fill="#6ee7b7" stroke="#1a7a52" stroke-width="1.5"/>
  <ellipse cx="90" cy="28" rx="15" ry="6" transform="rotate(-12 90 28)" fill="#f9c846" stroke="#c99a1f" stroke-width="1.2"/>
  <circle cx="60" cy="13" r="3" fill="#f9c846"/>
</svg>`,
  },
  {
    id: 'hat-wizard',
    nombre: 'Sombrero de mago',
    precio: 65,
    svgAdelante: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="60" cy="28" rx="30" ry="6" fill="#6ee7b7" stroke="#1a7a52" stroke-width="1.5"/>
  <path d="M44,27 L58,5 Q64,1 61,9 L76,27 Z" fill="#6ee7b7" stroke="#1a7a52" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="61" cy="9" r="2.6" fill="#f9c846"/>
  <circle cx="55" cy="17" r="2" fill="#f9c846"/>
  <circle cx="68" cy="19" r="1.6" fill="#f9c846"/>
</svg>`,
  },
  {
    id: 'hat-crown',
    nombre: 'Corona',
    precio: 80,
    svgAdelante: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M30,27 L37,13 L47,23 L58,10 L69,23 L79,13 L88,27 Z" fill="#f9c846" stroke="#c99a1f" stroke-width="1.5" stroke-linejoin="round"/>
  <rect x="30" y="25" width="58" height="6" rx="2" fill="#f9c846" stroke="#c99a1f" stroke-width="1.2"/>
  <circle cx="37" cy="14" r="3" fill="#6ee7b7"/>
  <circle cx="58" cy="11" r="3.5" fill="#ff6b6b"/>
  <circle cx="79" cy="14" r="3" fill="#6ee7b7"/>
</svg>`,
  },
  {
    id: 'hat-helmet',
    nombre: 'Casco',
    precio: 100,
    svgAdelante: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M18,32 Q18,8 60,8 Q102,8 102,32 L102,34 Q60,40 18,34 Z" fill="#f9c846" stroke="#c99a1f" stroke-width="1.8"/>
  <path d="M18,32 L102,32" stroke="#c99a1f" stroke-width="1.2"/>
  <circle cx="30" cy="24" r="1.8" fill="#c99a1f"/>
  <circle cx="90" cy="24" r="1.8" fill="#c99a1f"/>
</svg>`,
  },
]
