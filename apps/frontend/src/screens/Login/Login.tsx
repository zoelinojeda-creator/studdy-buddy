import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
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
      <Card className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h1 className={styles.title}>StudyBuddy</h1>

          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <button className={styles.link} type="button" onClick={onSwitchToRegistro}>
            ¿Sos nuevo? Creá una cuenta
          </button>

          <Button variant="secondary" onClick={loginAsGuest}>
            👻 Entrar como invitado
          </Button>
        </form>
      </Card>
    </div>
  )
}
