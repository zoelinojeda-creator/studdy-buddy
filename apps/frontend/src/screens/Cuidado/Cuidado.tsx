import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useRoperoStore } from '../../store/useRoperoStore'
import { useCuidadoStore } from '../../store/useCuidadoStore'
import { ACCESSORIES } from '../../data/accessories'
import { ITEMS, type Item, type Necesidad } from '../../data/items'
import { MindyStage } from '../../components/MindyStage'
import styles from './Cuidado.module.css'

const NECESIDAD_LABEL: Record<Necesidad, { nombre: string; icono: string }> = {
  alimentacion: { nombre: 'Alimentación', icono: '🍽️' },
  diversion: { nombre: 'Diversión', icono: '🎈' },
  descanso: { nombre: 'Descanso', icono: '🛌' },
  higiene: { nombre: 'Higiene', icono: '🧴' },
}

const NECESIDADES_ORDEN: Necesidad[] = ['alimentacion', 'diversion', 'descanso', 'higiene']

function NeedBar({ necesidad, valor }: { necesidad: Necesidad; valor: number }) {
  const { nombre, icono } = NECESIDAD_LABEL[necesidad]
  return (
    <div className={styles.needRow}>
      <div className={styles.needLabel}>
        <span>
          {icono} {nombre}
        </span>
        <span>{valor}%</span>
      </div>
      <div className={styles.needTrack}>
        <div className={styles.needFill} style={{ width: `${valor}%` }} />
      </div>
    </div>
  )
}

function ItemRow({ item, xp, onUse }: { item: Item; xp: number; onUse: () => void }) {
  return (
    <div className={styles.item}>
      <span className={styles.itemIcon}>{item.icono}</span>
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{item.nombre}</span>
        <span className={styles.itemMeta}>
          +{item.recupera} · ⭐ {item.precio} XP
        </span>
      </div>
      <button type="button" className={styles.btnUse} onClick={onUse} disabled={xp < item.precio}>
        Usar
      </button>
    </div>
  )
}

export function Cuidado() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)

  const roperoLoaded = useRoperoStore((s) => s.loaded)
  const loadRopero = useRoperoStore((s) => s.loadState)
  const equippedAccessory = useRoperoStore((s) => s.equippedAccessory)

  const loading = useCuidadoStore((s) => s.loading)
  const valores = useCuidadoStore((s) => s.valores)
  const loadState = useCuidadoStore((s) => s.loadState)
  const useItem = useCuidadoStore((s) => s.useItem)

  const [message, setMessage] = useState<string | null>(null)

  const userId = session?.user.id
  const equipped = ACCESSORIES.find((a) => a.id === equippedAccessory)

  useEffect(() => {
    if (userId && !roperoLoaded) loadRopero(userId)
  }, [userId, roperoLoaded, loadRopero])

  useEffect(() => {
    if (userId) loadState(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function handleUse(item: Item) {
    if (!userId) return
    setMessage(null)
    const res = await useItem(userId, item)
    if (!res.ok) setMessage(res.error ?? 'No se pudo usar el item')
  }

  if (!profile) {
    return (
      <div className={styles.wrap}>
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Cuidado de Mindy</h1>
        <div className={styles.xpBadge}>⭐ {profile.xp} XP disponible</div>

        <MindyStage accessory={equipped} nivel={profile.level} />

        {message && <p className={styles.error}>{message}</p>}
        {loading && <p className={styles.hint}>Sincronizando...</p>}

        <div className={styles.needs}>
          {NECESIDADES_ORDEN.map((necesidad) => (
            <NeedBar key={necesidad} necesidad={necesidad} valor={valores[necesidad]} />
          ))}
        </div>

        {NECESIDADES_ORDEN.map((necesidad) => (
          <section className={styles.section} key={necesidad}>
            <h2 className={styles.sectionTitle}>
              {NECESIDAD_LABEL[necesidad].icono} {NECESIDAD_LABEL[necesidad].nombre}
            </h2>
            <div className={styles.list}>
              {ITEMS.filter((i) => i.necesidad === necesidad).map((item) => (
                <ItemRow key={item.id} item={item} xp={profile.xp} onUse={() => handleUse(item)} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
