import { useId } from 'react'
import type { Accessory } from '../data/accessories'
import { getStageForLevel } from '../data/stages'
import styles from './MindyStage.module.css'

// Los ids de SVG son globales en el documento. Si un mismo SVG (por ejemplo
// la etapa Inmortal, que usa <defs> con gradientes de id fijo) llegara a
// renderizarse dos veces a la vez en pantalla, los ids colisionarian y los
// gradientes se verian mal. Le damos a cada instancia un sufijo unico
// (useId) y renombramos sus ids + referencias antes de inyectarlo.
function namespaceSvgIds(svg: string, suffix: string): string {
  const ids = new Set<string>()
  const idRegex = /\bid="([^"]+)"/g
  let match: RegExpExecArray | null
  while ((match = idRegex.exec(svg))) ids.add(match[1])
  if (ids.size === 0) return svg

  let result = svg
  for (const id of ids) {
    const scoped = `${id}-${suffix}`
    result = result
      .split(`id="${id}"`)
      .join(`id="${scoped}"`)
      .split(`url(#${id})`)
      .join(`url(#${scoped})`)
      .split(`href="#${id}"`)
      .join(`href="#${scoped}"`)
  }
  return result
}

export function MindyLayer({ svg }: { svg: string }) {
  const uid = useId().replace(/:/g, '')
  return <div className={styles.layer} dangerouslySetInnerHTML={{ __html: namespaceSvgIds(svg, uid) }} />
}

export function MindyStage({ accessory, nivel }: { accessory?: Accessory; nivel: number }) {
  const stage = getStageForLevel(nivel)
  return (
    <div className={styles.stage}>
      {accessory?.svgAtras && <MindyLayer svg={accessory.svgAtras} />}
      <MindyLayer svg={stage.svg} />
      {accessory?.svgAdelante && <MindyLayer svg={accessory.svgAdelante} />}
    </div>
  )
}
