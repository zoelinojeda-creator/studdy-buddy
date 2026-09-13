// Etapas de crecimiento de Mindy segun el nivel del usuario (columna "level"
// de la tabla usuarios). Todas comparten la misma geometria base (viewBox
// 0 0 120 130, cuerpo/ojo/antenas en las mismas coordenadas) para que los
// accesorios de src/data/accessories.ts sigan encajando en cualquier etapa.

export interface MindyStage {
  id: string
  nombre: string
  nivelMin: number
  nivelMax: number | null
  svg: string
}

export const MINDY_STAGES: MindyStage[] = [
  {
    id: 'mindy-baby',
    nombre: 'Bebé',
    nivelMin: 1,
    nivelMax: 4,
    svg: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 110 C25 110 15 85 15 65 C15 35 30 20 60 20 C90 20 105 35 105 65 C105 85 95 110 60 110Z" fill="#9ee6ae"/>
  <path d="M60 105 C28 105 20 82 20 63 C20 37 33 25 60 25 C87 25 100 37 100 63 C100 82 92 105 60 105Z" fill="#bdf0c8"/>
  <path d="M35 25 Q28 16 25 8" stroke="#7fb88a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="25" cy="7" r="3.5" fill="#8fc99a"/>
  <path d="M85 25 Q92 16 95 8" stroke="#7fb88a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="95" cy="7" r="3.5" fill="#8fc99a"/>
  <ellipse cx="38" cy="63" rx="5" ry="3.5" fill="#ffb6c1" opacity=".6"/>
  <ellipse cx="82" cy="63" rx="5" ry="3.5" fill="#ffb6c1" opacity=".6"/>
  <circle cx="60" cy="58" r="20" fill="#1a1a2e"/>
  <circle cx="60" cy="58" r="12" fill="white"/>
  <circle cx="64" cy="54" r="3.5" fill="white" opacity=".9"/>
  <ellipse cx="60" cy="85" rx="7" ry="5" fill="#ffd9e8" stroke="#e79bb9" stroke-width="1"/>
  <circle cx="60" cy="78" r="2.8" fill="none" stroke="#e79bb9" stroke-width="1.6"/>
  <ellipse cx="60" cy="91" rx="3.2" ry="2.2" fill="#ffb8d1"/>
  <ellipse cx="30" cy="90" rx="6" ry="4" fill="#9ee6ae" transform="rotate(-20,30,90)"/>
  <ellipse cx="42" cy="100" rx="6" ry="3.5" fill="#9ee6ae"/>
  <ellipse cx="55" cy="104" rx="5" ry="3.5" fill="#9ee6ae"/>
  <ellipse cx="68" cy="104" rx="5" ry="3.5" fill="#9ee6ae"/>
  <ellipse cx="80" cy="100" rx="6" ry="3.5" fill="#9ee6ae"/>
  <ellipse cx="90" cy="90" rx="6" ry="4" fill="#9ee6ae" transform="rotate(20,90,90)"/>
</svg>`,
  },
  {
    id: 'mindy-young',
    nombre: 'Joven',
    nivelMin: 5,
    nivelMax: 9,
    svg: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 110 C25 110 15 85 15 65 C15 35 30 20 60 20 C90 20 105 35 105 65 C105 85 95 110 60 110Z" fill="#2d7a3a"/>
  <path d="M60 105 C28 105 20 82 20 63 C20 37 33 25 60 25 C87 25 100 37 100 63 C100 82 92 105 60 105Z" fill="#3a9a4a"/>
  <path d="M35 25 Q28 12 25 8" stroke="#4a6a2a" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="25" cy="7" r="5" fill="#5a7a35"/>
  <path d="M85 25 Q92 12 95 8" stroke="#4a6a2a" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="95" cy="7" r="5" fill="#5a7a35"/>
  <circle cx="60" cy="58" r="20" fill="#1a1a2e"/>
  <circle cx="60" cy="58" r="9" fill="white"/>
  <circle cx="63" cy="55" r="3" fill="white" opacity=".8"/>
  <path d="M46,84 Q56,88 65,83 Q70,81 75,84" stroke="#1a1a2e" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="30" cy="90" rx="7" ry="5" fill="#2d7a3a" transform="rotate(-20,30,90)"/>
  <ellipse cx="42" cy="100" rx="7" ry="4" fill="#2d7a3a"/>
  <ellipse cx="55" cy="104" rx="6" ry="4" fill="#2d7a3a"/>
  <ellipse cx="68" cy="104" rx="6" ry="4" fill="#2d7a3a"/>
  <ellipse cx="80" cy="100" rx="7" ry="4" fill="#2d7a3a"/>
  <ellipse cx="90" cy="90" rx="7" ry="5" fill="#2d7a3a" transform="rotate(20,90,90)"/>
</svg>`,
  },
  {
    id: 'mindy-adult',
    nombre: 'Adulta',
    nivelMin: 10,
    nivelMax: 29,
    svg: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 110 C25 110 15 85 15 65 C15 35 30 20 60 20 C90 20 105 35 105 65 C105 85 95 110 60 110Z" fill="#1f5c2a"/>
  <path d="M60 105 C28 105 20 82 20 63 C20 37 33 25 60 25 C87 25 100 37 100 63 C100 82 92 105 60 105Z" fill="#2d7a3a"/>
  <line x1="35" y1="25" x2="25" y2="8" stroke="#274d1d" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="25" cy="7" r="5" fill="#3a5a28"/>
  <line x1="85" y1="25" x2="95" y2="8" stroke="#274d1d" stroke-width="4.5" stroke-linecap="round"/>
  <circle cx="95" cy="7" r="5" fill="#3a5a28"/>
  <circle cx="45" cy="45" r="3" fill="#000" opacity=".08"/>
  <circle cx="78" cy="48" r="2.4" fill="#000" opacity=".08"/>
  <circle cx="60" cy="95" r="3" fill="#000" opacity=".08"/>
  <path d="M40,44 L50,42" stroke="#0f0f1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M80,44 L70,42" stroke="#0f0f1a" stroke-width="2" stroke-linecap="round"/>
  <circle cx="60" cy="58" r="20" fill="#0f0f1a"/>
  <circle cx="60" cy="58" r="7" fill="white"/>
  <circle cx="63" cy="55" r="2.2" fill="white" opacity=".8"/>
  <path d="M46,83 Q60,88 74,83" stroke="#0f0f1a" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="30" cy="90" rx="7" ry="5" fill="#1f5c2a" transform="rotate(-20,30,90)"/>
  <ellipse cx="42" cy="100" rx="7" ry="4" fill="#1f5c2a"/>
  <ellipse cx="55" cy="104" rx="6" ry="4" fill="#1f5c2a"/>
  <ellipse cx="68" cy="104" rx="6" ry="4" fill="#1f5c2a"/>
  <ellipse cx="80" cy="100" rx="7" ry="4" fill="#1f5c2a"/>
  <ellipse cx="90" cy="90" rx="7" ry="5" fill="#1f5c2a" transform="rotate(20,90,90)"/>
</svg>`,
  },
  {
    id: 'mindy-elder',
    nombre: 'Abuelita',
    nivelMin: 30,
    nivelMax: 49,
    svg: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 110 C25 110 15 85 15 65 C15 35 30 20 60 20 C90 20 105 35 105 65 C105 85 95 110 60 110Z" fill="#8fb894"/>
  <path d="M60 105 C28 105 20 82 20 63 C20 37 33 25 60 25 C87 25 100 37 100 63 C100 82 92 105 60 105Z" fill="#addbb3"/>
  <path d="M35 25 Q15 22 20 14 Q24 8 25 8" stroke="#5f7a63" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="25" cy="7" r="5" fill="#d8d8d8"/>
  <path d="M85 25 Q105 22 100 14 Q96 8 95 8" stroke="#5f7a63" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="95" cy="7" r="5" fill="#d8d8d8"/>
  <path d="M40 42 Q45 40 50 43" stroke="#5f7a63" stroke-width="1.2" fill="none" opacity=".5"/>
  <path d="M70 42 Q75 40 80 43" stroke="#5f7a63" stroke-width="1.2" fill="none" opacity=".5"/>
  <path d="M12 68 Q6 68 6 74 L6 108" stroke="#8a6a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="6" cy="112" rx="4" ry="2" fill="#8a6a3a"/>
  <circle cx="60" cy="58" r="20" fill="#2a2a38"/>
  <circle cx="60" cy="58" r="8" fill="#e8e8ec"/>
  <circle cx="63" cy="56" r="2.2" fill="white" opacity=".7"/>
  <circle cx="60" cy="58" r="23" fill="none" stroke="#8a6a3a" stroke-width="3"/>
  <path d="M83,52 L94,46" stroke="#8a6a3a" stroke-width="3" stroke-linecap="round"/>
  <path d="M37,52 L26,46" stroke="#8a6a3a" stroke-width="3" stroke-linecap="round"/>
  <path d="M47,84 Q60,89 73,84" stroke="#2a2a38" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M45,83 Q43,86 45,89" stroke="#5f7a63" stroke-width="1" fill="none" opacity=".5"/>
  <path d="M75,83 Q77,86 75,89" stroke="#5f7a63" stroke-width="1" fill="none" opacity=".5"/>
  <ellipse cx="30" cy="90" rx="7" ry="4" fill="#8fb894" transform="rotate(-25,30,90)"/>
  <ellipse cx="42" cy="100" rx="6" ry="3.5" fill="#8fb894"/>
  <ellipse cx="55" cy="104" rx="5" ry="3.5" fill="#8fb894"/>
  <ellipse cx="68" cy="104" rx="5" ry="3.5" fill="#8fb894"/>
  <ellipse cx="80" cy="100" rx="6" ry="3.5" fill="#8fb894"/>
  <ellipse cx="90" cy="90" rx="7" ry="4" fill="#8fb894" transform="rotate(25,90,90)"/>
</svg>`,
  },
  {
    id: 'mindy-immortal',
    nombre: 'Inmortal',
    nivelMin: 50,
    nivelMax: null,
    svg: `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="immortalAura" cx="50%" cy="45%" r="60%"><stop offset="0%" stop-color="#fff6d0" stop-opacity="0.55"/><stop offset="100%" stop-color="#f9c846" stop-opacity="0"/></radialGradient>
    <linearGradient id="immortalBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f9c846"/><stop offset="50%" stop-color="#6ee7b7"/><stop offset="100%" stop-color="#c9a6ff"/></linearGradient>
    <radialGradient id="immortalEye" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff6d0"/><stop offset="60%" stop-color="#f9c846"/><stop offset="100%" stop-color="#c9a6ff"/></radialGradient>
  </defs>
  <circle cx="60" cy="62" r="52" fill="url(#immortalAura)"/>
  <path d="M60 110 C25 110 15 85 15 65 C15 35 30 20 60 20 C90 20 105 35 105 65 C105 85 95 110 60 110Z" fill="url(#immortalBody)"/>
  <path d="M60 105 C28 105 20 82 20 63 C20 37 33 25 60 25 C87 25 100 37 100 63 C100 82 92 105 60 105Z" fill="#fff8e6" opacity=".25"/>
  <line x1="35" y1="25" x2="25" y2="8" stroke="#f9c846" stroke-width="4" stroke-linecap="round"/>
  <circle cx="25" cy="7" r="5.5" fill="#fff6d0"/>
  <line x1="85" y1="25" x2="95" y2="8" stroke="#f9c846" stroke-width="4" stroke-linecap="round"/>
  <circle cx="95" cy="7" r="5.5" fill="#fff6d0"/>
  <circle cx="60" cy="58" r="20" fill="#1a1a2e"/>
  <circle cx="60" cy="58" r="14" fill="url(#immortalEye)"/>
  <circle cx="63" cy="54" r="3" fill="white" opacity=".9"/>
  <polyline points="44,78 49,74 54,78 59,74 64,78 69,74 74,78" stroke="#1a1a2e" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
  <ellipse cx="30" cy="90" rx="7" ry="5" fill="url(#immortalBody)" transform="rotate(-20,30,90)"/>
  <ellipse cx="42" cy="100" rx="7" ry="4" fill="url(#immortalBody)"/>
  <ellipse cx="55" cy="104" rx="6" ry="4" fill="url(#immortalBody)"/>
  <ellipse cx="68" cy="104" rx="6" ry="4" fill="url(#immortalBody)"/>
  <ellipse cx="80" cy="100" rx="7" ry="4" fill="url(#immortalBody)"/>
  <ellipse cx="90" cy="90" rx="7" ry="5" fill="url(#immortalBody)" transform="rotate(20,90,90)"/>
  <circle cx="8" cy="35" r="1.6" fill="#fff6d0"/>
  <circle cx="112" cy="42" r="1.3" fill="#fff6d0"/>
  <circle cx="12" cy="95" r="1.4" fill="#fff6d0"/>
  <circle cx="108" cy="92" r="1.5" fill="#fff6d0"/>
  <circle cx="60" cy="10" r="1.3" fill="#fff6d0"/>
</svg>`,
  },
]

export function getStageForLevel(nivel: number): MindyStage {
  const safe = Number.isFinite(nivel) && nivel >= 1 ? nivel : 1
  const found = MINDY_STAGES.find((s) => safe >= s.nivelMin && (s.nivelMax === null || safe <= s.nivelMax))
  return found ?? MINDY_STAGES[0]
}
