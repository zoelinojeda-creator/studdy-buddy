import { useEffect, useState } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { Login } from './screens/Login/Login'
import { Perfil } from './screens/Perfil/Perfil'
import { Ropero } from './screens/Ropero/Ropero'
import { Cuidado } from './screens/Cuidado/Cuidado'
import styles from './App.module.css'

type Tab = 'perfil' | 'ropero' | 'cuidado'

function App() {
  const session = useAuthStore((s) => s.session)
  const init = useAuthStore((s) => s.init)
  const [tab, setTab] = useState<Tab>('perfil')

  useEffect(() => {
    init()
  }, [init])

  if (!session) return <Login />

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
      </nav>
      {tab === 'perfil' && <Perfil />}
      {tab === 'ropero' && <Ropero />}
      {tab === 'cuidado' && <Cuidado />}
    </div>
  )
}

export default App
