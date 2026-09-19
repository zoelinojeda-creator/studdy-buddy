import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import styles from './Button.module.css'

// Variantes tomadas de docs/css/app.css:
// - primary: .btn-gold / .btn-cont.on / .btn-pri (dorado, fuente Fredoka One)
// - secondary: .btn-ghost / .btn-out (transparente, borde punteado)
// - danger: .btn-no (rojo, usado hoy en "No la sabia" de Flashcards)
// - success: .btn-yes / .btn-verify (menta, acciones positivas en general)
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success'

// Tamanos con los valores exactos de la referencia:
// - md: tamano estandar compartido por el resto de la app
// - lg: .btn-gold (padding 13px, 1.05rem, radio 14px)
// - ghost: .btn-ghost (padding 11px, .93rem, radio 13px)
export type ButtonSize = 'md' | 'lg' | 'ghost'

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  success: styles.success,
}

const SIZE_CLASS: Record<ButtonSize, string | undefined> = {
  md: undefined,
  lg: styles.lg,
  ghost: styles.ghostSize,
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  ripple?: boolean
}

// Puerto de ripple() (docs/js/utils.js): circulo que se expande desde el
// punto del click y se borra a los 560ms.
function spawnRipple(e: MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const span = document.createElement('span')
  span.className = styles.ripple
  span.style.width = `${size}px`
  span.style.height = `${size}px`
  span.style.left = `${e.clientX - rect.left - size / 2}px`
  span.style.top = `${e.clientY - rect.top - size / 2}px`
  btn.appendChild(span)
  setTimeout(() => span.remove(), 560)
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  ripple = false,
  className,
  type = 'button',
  onClick,
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block && styles.block,
    ripple && styles.rippleHost,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    if (ripple) spawnRipple(e)
    onClick?.(e)
  }

  return <button type={type} className={classes} onClick={handleClick} {...props} />
}
