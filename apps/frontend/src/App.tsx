import { useEffect, useState } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { BgCanvas } from './components/BgCanvas'
import { Toast } from './components/Toast'
import { AuthLayout } from './screens/Auth/AuthLayout'
import { Login } from './screens/Login/Login'
import { Registro } from './screens/Registro/Registro'
import { Mascota } from './screens/Mascota/Mascota'
import { Perfil } from './screens/Perfil/Perfil'
import { AulasProfesor } from './screens/Aulas/AulasProfesor'
import { AulasAlumno } from './screens/Aulas/AulasAlumno'
import { Actividad } from './screens/Actividad/Actividad'
import { Material } from './screens/Material/Material'
import { Juego } from './screens/Juego/Juego'
import { Resultados } from './screens/Resultados/Resultados'

type Screen = 'mascota' | 'perfil' | 'estudiar' | 'aulas'
type EstudioScreen = 'actividad' | 'material' | 'juego' | 'resultados'

function App() {
  const authMode = useAuthStore((s) => s.authMode)
  const profile = useAuthStore((s) => s.profile)
  const init = useAuthStore((s) => s.init)
  const [screen, setScreen] = useState<Screen>('mascota')
  const [authView, setAuthView] = useState<'login' | 'registro'>('login')
  const [estudioScreen, setEstudioScreen] = useState<EstudioScreen>('actividad')

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (authMode === null) setScreen('mascota')
  }, [authMode])

  // Resguardo: Mascota no muestra el boton "Aulas" para invitado, asi que
  // esto no deberia poder pasar por navegacion normal — pero si screen
  // quedara en 'aulas' con un invitado (ej. cambio de cuenta a mitad de
  // sesion), se vuelve a Mascota en vez de mostrar una pantalla vacia.
  useEffect(() => {
    if (screen === 'aulas' && authMode === 'guest') setScreen('mascota')
  }, [screen, authMode])

  function irAEstudiar() {
    setEstudioScreen('actividad')
    setScreen('estudiar')
  }

  // El fondo de particulas (BgCanvas) se monta una sola vez, fuera de todo
  // esto — por eso el contenido de pantalla se arma aparte y se agrega
  // como hijo suyo en el return final, en vez de retornarse directo.
  function renderContent() {
    // AuthLayout se mantiene montado al alternar pestanas: solo cambia el
    // panel de adentro (como #pLogin/#pReg en la referencia), asi el
    // huevo y la animacion de entrada de la tarjeta no se reinician.
    if (authMode === null) {
      return (
        <AuthLayout tab={authView} onTabChange={setAuthView}>
          {authView === 'login' ? <Login /> : <Registro />}
        </AuthLayout>
      )
    }

    if (screen === 'mascota') {
      return (
        <Mascota
          onIrAPerfil={() => setScreen('perfil')}
          onIrAEstudiar={irAEstudiar}
          onIrAAulas={() => setScreen('aulas')}
        />
      )
    }

    if (screen === 'perfil') return <Perfil onVolver={() => setScreen('mascota')} />

    if (screen === 'aulas' && authMode !== 'guest') {
      return profile?.rol === 'profesor' ? (
        <AulasProfesor onVolver={() => setScreen('mascota')} />
      ) : (
        <AulasAlumno onVolver={() => setScreen('mascota')} />
      )
    }

    if (screen === 'estudiar') {
      if (estudioScreen === 'actividad') {
        return (
          <Actividad onContinuar={() => setEstudioScreen('material')} onVolverAMascota={() => setScreen('mascota')} />
        )
      }
      if (estudioScreen === 'material') {
        return <Material onVolver={() => setEstudioScreen('actividad')} onGenerado={() => setEstudioScreen('juego')} />
      }
      if (estudioScreen === 'juego') {
        return <Juego onTerminar={() => setEstudioScreen('resultados')} />
      }
      return (
        <Resultados
          onNuevoTema={() => setEstudioScreen('actividad')}
          onRepetir={() => setEstudioScreen('juego')}
          onVolverAMascota={() => {
            setEstudioScreen('actividad')
            setScreen('mascota')
          }}
        />
      )
    }

    // screen === 'aulas' && authMode === 'guest': el useEffect de arriba ya
    // programo la vuelta a Mascota — no renderizamos nada en este instante.
    return null
  }

  return (
    <>
      <BgCanvas />
      <Toast />
      {renderContent()}
    </>
  )
}

export default App
