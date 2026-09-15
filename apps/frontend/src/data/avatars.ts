// Mismos avatares que docs/js/data.js (AV_EMOJI), sin 'invitado' (ese es
// solo para modo invitado). Compartido entre Perfil, Registro y las
// pantallas de Aulas (donde el profesor ve el avatar de sus alumnos).
export const AVATAR_OPTIONS = [
  { key: 'huevo', emoji: '🐣' },
  { key: 'zorro', emoji: '🦊' },
  { key: 'rana', emoji: '🐸' },
  { key: 'pulpo', emoji: '🐙' },
  { key: 'mariposa', emoji: '🦋' },
]

export function avatarEmoji(key: string): string {
  return AVATAR_OPTIONS.find((a) => a.key === key)?.emoji ?? '❓'
}
