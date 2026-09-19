import type { HTMLAttributes } from 'react'
import styles from './Card.module.css'

// La caja/panel estandar que se repite en toda la app vieja
// (.section-box / .login-card / .res-card / .load-card).
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const classes = [styles.card, className].filter(Boolean).join(' ')
  return <div className={classes} {...props} />
}
