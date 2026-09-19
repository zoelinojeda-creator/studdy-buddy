import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useCuidadoStore } from '../../store/useCuidadoStore'
import { ITEMS, NECESIDAD_LABEL, type Item, type Necesidad } from '../../data/items'
import { Card } from '../../components/ui/Card'
import { floatEmoji } from '../../lib/floatEmoji'
import styles from './Cuidado.module.css'

const NECESIDADES_ORDEN: Necesidad[] = ['alimentacion', 'diversion', 'descanso', 'higiene']

// Puerto de .sh-grid/.sh-item (docs/css/app.css) — toda la tarjeta es el
// boton, como buyFood en la app vieja (sin texto "Usar" separado).
function ItemCard({ item, xp, onUse }: { item: Item; xp: number; onUse: () => void }) {
  return (
    <button type="button" className={styles.itemCard} onClick={onUse} disabled={xp < item.precio}>
      <span className={styles.itemIco}>{item.icono}</span>
      <span className={styles.itemNm}>{item.nombre}</span>
      <span className={styles.itemPr}>
        +{item.recupera} · ⭐ {item.precio}
      </span>
    </button>
  )
}

export function Cuidado({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile)

  const loading = useCuidadoStore((s) => s.loading)
  const loadState = useCuidadoStore((s) => s.loadState)
  const useItem = useCuidadoStore((s) => s.useItem)

  const [message, setMessage] = useState<string | null>(null)

  const userId = profile?.id

  useEffect(() => {
    if (userId) loadState(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function handleUse(item: Item) {
    if (!userId) return
    setMessage(null)
    const res = await useItem(userId, item)
    if (!res.ok) {
      setMessage(res.error ?? 'No se pudo usar el item')
      return
    }
    // Mismo orden que buyFood (docs/js/screens/mascota.js): floatEmoji y
    // despues cierra el modal.
    floatEmoji(item.icono)
    onClose()
  }

  if (!profile) {
    return <p className={styles.hint}>Cargando...</p>
  }

  return (
    <Card className={styles.card}>
      <h1 className={styles.title}>Cuidado de Mindy</h1>
      <div className={styles.xpBadge}>⭐ {profile.xp} XP disponible</div>

      {message && <p className={styles.error}>{message}</p>}
      {loading && <p className={styles.hint}>Sincronizando...</p>}

      {NECESIDADES_ORDEN.map((necesidad) => (
        <section className={styles.section} key={necesidad}>
          <h2 className={styles.sectionTitle}>
            {NECESIDAD_LABEL[necesidad].icono} {NECESIDAD_LABEL[necesidad].nombre}
          </h2>
          <div className={styles.itemsGrid}>
            {ITEMS.filter((i) => i.necesidad === necesidad).map((item) => (
              <ItemCard key={item.id} item={item} xp={profile.xp} onUse={() => handleUse(item)} />
            ))}
          </div>
        </section>
      ))}
    </Card>
  )
}
