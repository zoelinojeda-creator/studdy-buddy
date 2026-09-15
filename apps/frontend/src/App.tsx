import { useEffect, useState } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { Login } from './screens/Login/Login'
import { Registro } from './screens/Registro/Registro'
import { Perfil } from './screens/Perfil/Perfil'
import { Ropero } from './screens/Ropero/Ropero'
import { Cuidado } from './screens/Cuidado/Cuidado'
import { AulasProfesor } from './screens/Aulas/AulasProfesor'
import { AulasAlumno } from './screens/Aulas/AulasAlumno'
import styles from './App.module.css'

type Tab = 'perfil' | 'ropero' | 'cuidado' | 'aulas'

function App() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const init = useAuthStore((s) => s.init)
  const [tab, setTab] = useState<Tab>('perfil')
  const [authView, setAuthView] = useState<'login' | 'registro'>('login')

  useEffect(() => {
    init()
  }, [init])

  if (!session) {
    return authView === 'login' ? (
      <Login onSwitchToRegistro={() => setAuthView('registro')} />
    ) : (
      <Registro onSwitchToLogin={() => setAuthView('login')} />
    )
  }

  return (
    <div>
      <nav className={styles.tabs}>
        <button
          type="button"
          className={tab === 'perfil' ? `${styles.tabBtn} ${styles.tabBtnOn}` : styles.tabBtn}
          onClick={() => setTab('perfil')}
        >
          Perfil
        </button>
        <button
          type="button"
          className={tab === 'ropero' ? `${styles.tabBtn} ${styles.tabBtnOn}` : styles.tabBtn}
          onClick={() => setTab('ropero')}
        >
          Ropero
        </button>
        <button
          type="button"
          className={tab === 'cuidado' ? `${styles.tabBtn} ${styles.tabBtnOn}` : styles.tabBtn}
          onClick={() => setTab('cuidado')}
        >
          Cuidado
        </button>
        <button
          type="button"
          className={tab === 'aulas' ? `${styles.tabBtn} ${styles.tabBtnOn}` : styles.tabBtn}
          onClick={() => setTab('aulas')}
        >
          Aulas
        </button>
      </nav>
      {tab === 'perfil' && <Perfil />}
      {tab === 'ropero' && <Ropero />}
      {tab === 'cuidado' && <Cuidado />}
      {tab === 'aulas' && (profile?.rol === 'profesor' ? <AulasProfesor /> : <AulasAlumno />)}
    </div>
  )
}

export default App
