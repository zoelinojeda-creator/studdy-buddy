import type { ReactNode } from 'react'
import { Card } from '../../components/ui/Card'
import { MindyEgg } from './MindyEgg'
import styles from './AuthLayout.module.css'

export type AuthTab = 'login' | 'registro'

// Puerto de #inicio (docs/index.html): cabecera con huevo + logo, barra
// decorativa y UNA tarjeta con pestanas Entrar/Registro. Se monta una sola
// vez en App.tsx y lo que cambia al alternar pestanas es el contenido
// (children), como en la referencia donde solo se alternan los paneles.
export function AuthLayout({
  tab,
  onTabChange,
  children,
}: {
  tab: AuthTab
  onTabChange: (tab: AuthTab) => void
  children: ReactNode
}) {
  const esLogin = tab === 'login'

  return (
    <div className={styles.wrap}>
      <div className={styles.loginWrap}>
        <div className={styles.logoArea}>
          <MindyEgg />
          <div className={styles.logoTxt}>StudyBuddy</div>
          <div className={styles.logoSub}>Tu compañero de estudio ✨</div>
        </div>
        <div className={styles.xpDeco} />

        <Card className={styles.card}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={esLogin ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              onClick={() => onTabChange('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={!esLogin ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              onClick={() => onTabChange('registro')}
            >
              Registro
            </button>
          </div>

          {children}

          <div className={styles.foot}>
            {esLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button type="button" className={styles.footLink} onClick={() => onTabChange(esLogin ? 'registro' : 'login')}>
              {esLogin ? 'Regístrate gratis' : 'Inicia sesión'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
