import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useRoperoStore } from '../../store/useRoperoStore'
import { ACCESSORIES, type Accessory } from '../../data/accessories'
import { Card } from '../../components/ui/Card'
import { floatEmoji } from '../../lib/floatEmoji'
import styles from './Ropero.module.css'

// Puerto del patron de .sh-item (docs/css/app.css): toda la tarjeta es el
// boton, no hay un boton de texto separado. Igual que buyOutfit en la app
// vieja, tocar un accesorio sin comprar lo compra Y lo equipa a la vez.
// Estados: sin comprar (precio, click compra+equipa), comprado sin equipar
// ("Equipar", click equipa), equipado (borde/fondo menta como
// .sh-item.wearing, "Equipado", click desequipa — esto ultimo no existe en
// la app vieja).
function AccessoryCard({
  accessory,
  owned,
  equipped,
  xp,
  onBuy,
  onEquip,
  onUnequip,
}: {
  accessory: Accessory
  owned: boolean
  equipped: boolean
  xp: number
  onBuy: () => void
  onEquip: () => void
  onUnequip: () => void
}) {
  function handleClick() {
    if (!owned) return onBuy()
    if (equipped) return onUnequip()
    return onEquip()
  }

  return (
    <button
      type="button"
      className={equipped ? `${styles.itemCard} ${styles.itemCardOn}` : styles.itemCard}
      onClick={handleClick}
      disabled={!owned && xp < accessory.precio}
    >
      <div
        className={styles.itemThumb}
        dangerouslySetInnerHTML={{ __html: accessory.svgAdelante ?? accessory.svgAtras ?? '' }}
      />
      <span className={styles.itemNm}>{accessory.nombre}</span>
      {!owned && <span className={styles.itemPr}>⭐ {accessory.precio} XP</span>}
      {owned && !equipped && <span className={styles.itemState}>Equipar</span>}
      {equipped && <span className={styles.itemStateOn}>Equipado ✓</span>}
    </button>
  )
}

export function Ropero({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile)

  const loading = useRoperoStore((s) => s.loading)
  const equippedAccessory = useRoperoStore((s) => s.equippedAccessory)
  const rawOwnedOutfits = useRoperoStore((s) => s.rawOwnedOutfits)
  const loadState = useRoperoStore((s) => s.loadState)
  const buyAccessory = useRoperoStore((s) => s.buyAccessory)
  const equipAccessory = useRoperoStore((s) => s.equipAccessory)
  const unequipAccessory = useRoperoStore((s) => s.unequipAccessory)

  const [message, setMessage] = useState<string | null>(null)

  const userId = profile?.id

  useEffect(() => {
    if (userId) loadState(userId)
  }, [userId, loadState])

  const isOwned = (id: string) => rawOwnedOutfits.includes(id)

  // Mismo orden que buyOutfit (docs/js/screens/mascota.js): floatEmoji y
  // despues cierra el modal — el emoji flota sobre Mindy ya descubierta.
  function celebrarYCerrar() {
    floatEmoji('✨')
    onClose()
  }

  async function handleBuy(accessory: Accessory) {
    if (!userId) return
    setMessage(null)
    const res = await buyAccessory(userId, accessory.id)
    if (!res.ok) {
      setMessage(res.error ?? 'No se pudo comprar')
      return
    }
    if (!(await equipAccessory(userId, accessory.id))) {
      setMessage('Se compro, pero no se pudo equipar')
      return
    }
    celebrarYCerrar()
  }

  async function handleEquip(id: string) {
    if (!userId) return
    setMessage(null)
    if (!(await equipAccessory(userId, id))) {
      setMessage('No se pudo equipar')
      return
    }
    celebrarYCerrar()
  }

  if (!profile) {
    return <p className={styles.hint}>Cargando...</p>
  }

  return (
    <Card className={styles.card}>
      <h1 className={styles.title}>Ropero de Mindy</h1>
      <div className={styles.xpBadge}>⭐ {profile.xp} XP disponible</div>

      {message && <p className={styles.error}>{message}</p>}
      {loading && <p className={styles.hint}>Sincronizando...</p>}

      <section className={styles.section}>
        <div className={styles.itemsGrid}>
          {ACCESSORIES.map((a) => (
            <AccessoryCard
              key={a.id}
              accessory={a}
              owned={isOwned(a.id)}
              equipped={equippedAccessory === a.id}
              xp={profile.xp}
              onBuy={() => handleBuy(a)}
              onEquip={() => handleEquip(a.id)}
              onUnequip={() => userId && unequipAccessory(userId)}
            />
          ))}
        </div>
      </section>
    </Card>
  )
}
