import type { ReactNode } from 'react'
import styles from './Modal.module.css'

// Shell generico para overlays tipo hoja-desde-abajo — puerto del mecanismo
// de #shopModal (docs/css/app.css .modal-ov/.shop-sheet, docs/js/screens/
// mascota.js openShop/closeShop/closeShopOv): backdrop fijo que cierra al
// clickear afuera del contenido, mas boton "x". No tiene logica de
// contenido — eso lo sigue manejando cada pantalla que se use adentro.
export function Modal({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.sheet}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
