import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { AVATAR_OPTIONS } from '../../data/avatars'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import styles from './Perfil.module.css'

export function Perfil({ onVolver }: { onVolver: () => void }) {
  const session = useAuthStore((s) => s.session)
  const authMode = useAuthStore((s) => s.authMode)
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
      <Card className={styles.card}>
        <Button variant="secondary" onClick={onVolver}>
          ← Volver
        </Button>

        <h1 className={styles.title}>Tu perfil</h1>

        {authMode === 'guest' && (
          <p className={styles.guestNotice}>
            👻 Estás jugando como invitado — tus datos se pierden al cerrar la pestaña.
          </p>
        )}

        <Input
          label="Correo"
          type="email"
          value={authMode === 'guest' ? 'Invitado (sin cuenta)' : (session?.user.email ?? '')}
          readOnly
          disabled
        />

        <Input
          label="Usuario"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value)
            setSaved(false)
          }}
        />

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

        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>

        <Button variant="secondary" onClick={logout}>
          Cerrar sesión
        </Button>
      </Card>
    </div>
  )
}
