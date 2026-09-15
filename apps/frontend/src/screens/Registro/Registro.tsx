import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { AVATAR_OPTIONS } from '../../data/avatars'
import styles from './Registro.module.css'

export function Registro({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('huevo')
  const [rol, setRol] = useState<'alumno' | 'profesor'>('alumno')

  const signUp = useAuthStore((s) => s.signUp)
  const loading = useAuthStore((s) => s.loading)
  const error = useAuthStore((s) => s.error)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    signUp(email, password, username, avatar, rol)
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Crear cuenta</h1>

        <label className={styles.label}>
          Correo
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Contraseña
          <input
            className={styles.input}
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className={styles.label}>
          Usuario
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
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
                onClick={() => setAvatar(opt.key)}
              >
                {opt.emoji}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.label}>
          ¿Sos alumno o profesor?
          <div className={styles.rolRow}>
            <button
              type="button"
              className={rol === 'alumno' ? `${styles.rolBtn} ${styles.rolBtnOn}` : styles.rolBtn}
              onClick={() => setRol('alumno')}
            >
              🎓 Alumno
            </button>
            <button
              type="button"
              className={rol === 'profesor' ? `${styles.rolBtn} ${styles.rolBtnOn}` : styles.rolBtn}
              onClick={() => setRol('profesor')}
            >
              🧑‍🏫 Profesor
            </button>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <button className={styles.link} type="button" onClick={onSwitchToLogin}>
          ¿Ya tenés cuenta? Iniciá sesión
        </button>
      </form>
    </div>
  )
}
