import { useEffect, useRef, useState } from 'react'
import anim from '../../styles/animations.module.css'
import styles from './MindyEgg.module.css'

// Puerto de pokeMindy() (docs/js/screens/inicio.js): al tocar el huevo sale
// una burbuja con un mensaje al azar (2.2s) y el huevo hace "scare" (.45s)
// antes de volver a su vaiven.
const MENSAJES = ['¡Hola! :)', '¡A estudiar!', '¡Tú puedes!', '¡Soy Mindy!', '¡Aprendamos!']

export function MindyEgg() {
  const [burbuja, setBurbuja] = useState<string | null>(null)
  const [asustado, setAsustado] = useState(false)
  const timers = useRef<{ burbuja?: ReturnType<typeof setTimeout>; susto?: ReturnType<typeof setTimeout> }>({})

  useEffect(() => {
    const t = timers.current
    return () => {
      clearTimeout(t.burbuja)
      clearTimeout(t.susto)
    }
  }, [])

  function poke() {
    setBurbuja(MENSAJES[Math.floor(Math.random() * MENSAJES.length)])
    clearTimeout(timers.current.burbuja)
    timers.current.burbuja = setTimeout(() => setBurbuja(null), 2200)

    setAsustado(true)
    clearTimeout(timers.current.susto)
    timers.current.susto = setTimeout(() => setAsustado(false), 450)
  }

  return (
    <div className={styles.row}>
      <div className={styles.box}>
        <svg
          className={asustado ? `${styles.egg} ${anim.scareShort}` : `${styles.egg} ${styles.eggBob}`}
          width="86"
          height="94"
          viewBox="0 0 90 100"
          onClick={poke}
        >
          <ellipse cx="45" cy="60" rx="32" ry="36" fill="#2d4a2d" />
          <ellipse cx="45" cy="56" rx="28" ry="30" fill="#3a6b3a" />
          <path d="M36 44 Q45 36 54 44" stroke="#f9c846" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="38" cy="52" r="6" fill="#1a1a1a" />
          <circle cx="38" cy="52" r="2.5" fill="white" />
          <circle cx="52" cy="52" r="6" fill="#1a1a1a" />
          <circle cx="52" cy="52" r="2.5" fill="white" />
          <circle cx="36" cy="62" r="5" fill="#ff6b6b" opacity=".45" />
          <circle cx="54" cy="62" r="5" fill="#ff6b6b" opacity=".45" />
          <path d="M40 42 Q45 34 50 42" stroke="#f9c846" strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="26" y="30" fontSize="9" fill="#f9c846" opacity=".8">
            ✶
          </text>
          <text x="55" y="25" fontSize="7" fill="#6ee7b7" opacity=".8">
            ✶
          </text>
        </svg>
        {burbuja && <div className={styles.bubble}>{burbuja}</div>}
      </div>
    </div>
  )
}
