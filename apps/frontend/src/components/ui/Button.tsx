import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

// Variantes tomadas de docs/css/app.css:
// - primary: .btn-gold / .btn-cont.on / .btn-pri (dorado, fuente Fredoka One)
// - secondary: .btn-ghost / .btn-out (transparente, borde punteado)
// - danger: .btn-no (rojo, usado hoy en "No la sabia" de Flashcards)
// - success: .btn-yes / .btn-verify (menta, acciones positivas en general)
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  success: styles.success,
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonProps) {
  const classes = [styles.button, VARIANT_CLASS[variant], className].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...props} />
}
