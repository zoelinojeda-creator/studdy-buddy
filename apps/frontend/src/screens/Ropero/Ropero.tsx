import { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { useRoperoStore } from '../../store/useRoperoStore'
import { ACCESSORIES, type Accessory } from '../../data/accessories'
import { MindyStage } from '../../components/MindyStage'
import styles from './Ropero.module.css'

function AccessoryRow({
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
  return (
    <div className={equipped ? `${styles.item} ${styles.itemOn}` : styles.item}>
      <div
        className={styles.itemThumb}
        dangerouslySetInnerHTML={{ __html: accessory.svgAdelante ?? accessory.svgAtras ?? '' }}
      />
      <div className={styles.itemInfo}>
        <span className={styles.itemName}>{accessory.nombre}</span>
        {!owned && <span className={styles.itemPrice}>⭐ {accessory.precio} XP</span>}
      </div>
      {owned ? (
        <button
          type="button"
          className={equipped ? styles.btnUnequip : styles.btnEquip}
          onClick={equipped ? onUnequip : onEquip}
        >
          {equipped ? 'Quitar' : 'Equipar'}
        </button>
      ) : (
        <button type="button" className={styles.btnBuy} onClick={onBuy} disabled={xp < accessory.precio}>
          Comprar
        </button>
      )}
    </div>
  )
}

export function Ropero() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)

  const loading = useRoperoStore((s) => s.loading)
  const equippedAccessory = useRoperoStore((s) => s.equippedAccessory)
  const rawOwnedOutfits = useRoperoStore((s) => s.rawOwnedOutfits)
  const loadState = useRoperoStore((s) => s.loadState)
  const buyAccessory = useRoperoStore((s) => s.buyAccessory)
  const equipAccessory = useRoperoStore((s) => s.equipAccessory)
  const unequipAccessory = useRoperoStore((s) => s.unequipAccessory)

  const [message, setMessage] = useState<string | null>(null)

  const userId = session?.user.id

  useEffect(() => {
    if (userId) loadState(userId)
  }, [userId, loadState])

  const isOwned = (id: string) => rawOwnedOutfits.includes(id)
  const equipped = ACCESSORIES.find((a) => a.id === equippedAccessory)

  async function handleBuy(accessory: Accessory) {
    if (!userId) return
    setMessage(null)
    const res = await buyAccessory(userId, accessory.id)
    if (!res.ok) setMessage(res.error ?? 'No se pudo comprar')
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
        <h1 className={styles.title}>Ropero de Mindy</h1>
        <div className={styles.xpBadge}>⭐ {profile.xp} XP disponible</div>

        <MindyStage accessory={equipped} />

        {message && <p className={styles.error}>{message}</p>}
        {loading && <p className={styles.hint}>Sincronizando...</p>}

        <section className={styles.section}>
          <div className={styles.list}>
            {ACCESSORIES.map((a) => (
              <AccessoryRow
                key={a.id}
                accessory={a}
                owned={isOwned(a.id)}
                equipped={equippedAccessory === a.id}
                xp={profile.xp}
                onBuy={() => handleBuy(a)}
                onEquip={() => userId && equipAccessory(userId, a.id)}
                onUnequip={() => userId && unequipAccessory(userId)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
