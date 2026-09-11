import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './Perfil.module.css'

// Mismos avatares que docs/js/data.js (AV_EMOJI), sin 'invitado' (ese es solo para modo invitado).
const AVATAR_OPTIONS = [
  { key: 'huevo', emoji: '🐣' },
  { key: 'zorro', emoji: '🦊' },
  { key: 'rana', emoji: '🐸' },
  { key: 'pulpo', emoji: '🐙' },
  { key: 'mariposa', emoji: '🦋' },
]

export function Perfil() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)
  const error = useAuthStore((s) => s.error)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const logout = useAuthStore((s) => s.logout)

  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('huevo')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username)
      setAvatar(profile.avatar)
    }
  }, [profile])

  async function handleSave() {
    setSaved(false)
    await updateProfile({ username, avatar })
    setSaved(true)
  }

  if (!profile) {
    return (
      <div className={styles.wrap}>
        <p>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Tu perfil</h1>

        <label className={styles.label}>
          Correo
          <input className={styles.input} type="email" value={session?.user.email ?? ''} readOnly disabled />
        </label>

        <label className={styles.label}>
          Usuario
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setSaved(false)
            }}
          />
        </label>

        <div className={styles.label}>
          Avatar
          <div className={styles.avatarRow}>
            {AVATAR_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={avatar === opt.key ? `${styles.avatarBtn} ${styles.avatarBtnOn}` : styles.avatarBtn}
                onClick={() => {
                  setAvatar(opt.key)
                  setSaved(false)
                }}
              >
                {opt.emoji}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {saved && !error && <p className={styles.success}>Guardado!</p>}

        <button className={styles.button} type="button" onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>

        <button className={styles.logout} type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
