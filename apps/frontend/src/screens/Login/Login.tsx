import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import styles from './Login.module.css'

// Panel #pLogin de docs/index.html. El marco (huevo, logo, pestanas, pie)
// lo pone AuthLayout, montado en App.tsx.
export function Login() {
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
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Correo"
          icon="👤"
          type="email"
          placeholder="tu@correo.com"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Contraseña"
          icon="🔒"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className={styles.error}>{error}</p>}

        <Button variant="primary" size="lg" block ripple type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar 🚀'}
        </Button>
      </form>

      <Button variant="secondary" size="ghost" block className={styles.guest} onClick={loginAsGuest}>
        👻 Entrar como invitado
      </Button>
    </>
  )
}
