import { useEffect, useState } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { Login } from './screens/Login/Login'
import { Registro } from './screens/Registro/Registro'
import { Perfil } from './screens/Perfil/Perfil'
import { Ropero } from './screens/Ropero/Ropero'
import { Cuidado } from './screens/Cuidado/Cuidado'
import { AulasProfesor } from './screens/Aulas/AulasProfesor'
import { AulasAlumno } from './screens/Aulas/AulasAlumno'
import { Actividad } from './screens/Actividad/Actividad'
import { Material } from './screens/Material/Material'
import { Juego } from './screens/Juego/Juego'
import { Resultados } from './screens/Resultados/Resultados'
import styles from './App.module.css'

type Tab = 'estudiar' | 'perfil' | 'ropero' | 'cuidado' | 'aulas'
type EstudioScreen = 'actividad' | 'material' | 'juego' | 'resultados'

function App() {
  const authMode = useAuthStore((s) => s.authMode)
  const profile = useAuthStore((s) => s.profile)
  const init = useAuthStore((s) => s.init)
  const [tab, setTab] = useState<Tab>('estudiar')
  const [authView, setAuthView] = useState<'login' | 'registro'>('login')
  const [estudioScreen, setEstudioScreen] = useState<EstudioScreen>('actividad')

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (authMode === null) setTab('estudiar')
  }, [authMode])

  if (authMode === null) {
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
          className={tab === 'estudiar' ? `${styles.tabBtn} ${styles.tabBtnOn}` : styles.tabBtn}
          onClick={() => setTab('estudiar')}
        >
          Estudiar
        </button>
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
        {authMode !== 'guest' && (
          <button
            type="button"
            className={tab === 'aulas' ? `${styles.tabBtn} ${styles.tabBtnOn}` : styles.tabBtn}
            onClick={() => setTab('aulas')}
          >
            Aulas
          </button>
        )}
      </nav>
      {tab === 'estudiar' && estudioScreen === 'actividad' && (
        <Actividad onContinuar={() => setEstudioScreen('material')} />
      )}
      {tab === 'estudiar' && estudioScreen === 'material' && (
        <Material
          onVolver={() => setEstudioScreen('actividad')}
          onGenerado={() => setEstudioScreen('juego')}
        />
      )}
      {tab === 'estudiar' && estudioScreen === 'juego' && (
        <Juego onTerminar={() => setEstudioScreen('resultados')} />
      )}
      {tab === 'estudiar' && estudioScreen === 'resultados' && (
        <Resultados
          onNuevoTema={() => setEstudioScreen('actividad')}
          onRepetir={() => setEstudioScreen('juego')}
        />
      )}
      {tab === 'perfil' && <Perfil />}
      {tab === 'ropero' && <Ropero />}
      {tab === 'cuidado' && <Cuidado />}
      {tab === 'aulas' &&
        authMode !== 'guest' &&
        (profile?.rol === 'profesor' ? <AulasProfesor /> : <AulasAlumno />)}
    </div>
  )
}

export default App
