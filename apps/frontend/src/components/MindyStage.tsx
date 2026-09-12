import type { Accessory } from '../data/accessories'
import styles from './MindyStage.module.css'

// Mismo dibujo base que docs/index.html (#msvg), solo como referencia visual
// para que Mindy se vea igual en ambas versiones. width/height a 100% para
// que llene el contenedor del stage en vez del tamaño fijo original.
const MINDY_BASE_SVG = `<svg viewBox="0 0 120 130" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <path d="M60 110 C25 110 15 85 15 65 C15 35 30 20 60 20 C90 20 105 35 105 65 C105 85 95 110 60 110Z" fill="#2d7a3a"/>
  <path d="M60 105 C28 105 20 82 20 63 C20 37 33 25 60 25 C87 25 100 37 100 63 C100 82 92 105 60 105Z" fill="#3a9a4a"/>
  <line x1="35" y1="25" x2="25" y2="8" stroke="#4a6a2a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="25" cy="7" r="5" fill="#5a7a35"/>
  <line x1="85" y1="25" x2="95" y2="8" stroke="#4a6a2a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="95" cy="7" r="5" fill="#5a7a35"/>
  <circle cx="60" cy="58" r="20" fill="#1a1a2e"/>
  <circle cx="60" cy="58" r="9" fill="white"/>
  <circle cx="63" cy="55" r="3" fill="white" opacity=".8"/>
  <polyline points="44,78 49,74 54,78 59,74 64,78 69,74 74,78" stroke="#1a1a2e" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
  <ellipse cx="30" cy="90" rx="7" ry="5" fill="#2d7a3a" transform="rotate(-20,30,90)"/>
  <ellipse cx="42" cy="100" rx="7" ry="4" fill="#2d7a3a"/>
  <ellipse cx="55" cy="104" rx="6" ry="4" fill="#2d7a3a"/>
  <ellipse cx="68" cy="104" rx="6" ry="4" fill="#2d7a3a"/>
  <ellipse cx="80" cy="100" rx="7" ry="4" fill="#2d7a3a"/>
  <ellipse cx="90" cy="90" rx="7" ry="5" fill="#2d7a3a" transform="rotate(20,90,90)"/>
</svg>`

export function MindyLayer({ svg }: { svg: string }) {
  return <div className={styles.layer} dangerouslySetInnerHTML={{ __html: svg }} />
}

export function MindyStage({ accessory }: { accessory?: Accessory }) {
  return (
    <div className={styles.stage}>
      {accessory?.svgAtras && <MindyLayer svg={accessory.svgAtras} />}
      <MindyLayer svg={MINDY_BASE_SVG} />
      {accessory?.svgAdelante && <MindyLayer svg={accessory.svgAdelante} />}
    </div>
  )
}
