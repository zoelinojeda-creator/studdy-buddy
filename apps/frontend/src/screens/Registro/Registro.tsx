import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { AVATAR_OPTIONS } from '../../data/avatars'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PasswordMeter } from './PasswordMeter'
import styles from './Registro.module.css'

// Panel #pReg de docs/index.html. El marco (huevo, logo, pestanas, pie) lo
// pone AuthLayout, montado en App.tsx. El selector Alumno/Profesor no
// existe en la referencia: es propio de este frontend.
export function Registro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('huevo')
  const [rol, setRol] = useState<'alumno' | 'profesor'>('alumno')

  const signUp = useAuthStore((s) => s.signUp)
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest)
  const loading = useAuthStore((s) => s.loading)
  const error = useAuthStore((s) => s.error)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    signUp(email, password, username, avatar, rol)
  }

  return (
    <>
      <div className={styles.avatarBlock}>
        <div className={styles.avatarCaption}>Elige tu avatar</div>
        <div className={styles.avatars}>
          {AVATAR_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={avatar === opt.key ? `${styles.av} ${styles.avOn}` : styles.av}
              onClick={() => setAvatar(opt.key)}
            >
              {opt.emoji}
            </button>
          ))}
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Usuario"
          icon="👤"
          type="text"
          placeholder="Estudiante123"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <Input
          label="Correo"
          icon="📧"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className={styles.pwGroup}>
          <Input
            label="Contraseña"
            icon="🔒"
            type="password"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <PasswordMeter value={password} />
        </div>

        <div className={styles.rolLabel}>
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

        <Button variant="primary" size="lg" block ripple type="submit" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta 🎉'}
        </Button>
      </form>

      <Button variant="secondary" size="ghost" block className={styles.guest} onClick={loginAsGuest}>
        👻 Entrar como invitado
      </Button>
    </>
  )
}
