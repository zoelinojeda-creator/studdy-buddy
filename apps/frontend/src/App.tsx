import { useEffect } from 'react'
import { useAuthStore } from './store/useAuthStore'
import { Login } from './screens/Login/Login'
import { Perfil } from './screens/Perfil/Perfil'

function App() {
  const session = useAuthStore((s) => s.session)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return session ? <Perfil /> : <Login />
}

export default App
