import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './Login.module.css'

export function Login({ onSwitchToRegistro }: { onSwitchToRegistro: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useAuthStore((s) => s.login)
  const loginAsGuest = useAuthStore((s) => s.loginAsGuest)
  const loading = useAuthStore((s) => s.loading)
  const error = useAuthStore((s) => s.error)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    login(email, password)
  }

  return (
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>StudyBuddy</h1>

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <button className={styles.link} type="button" onClick={onSwitchToRegistro}>
          ¿Sos nuevo? Creá una cuenta
        </button>

        <button className={styles.guestButton} type="button" onClick={loginAsGuest}>
          👻 Entrar como invitado
        </button>
      </form>
    </div>
  )
}
