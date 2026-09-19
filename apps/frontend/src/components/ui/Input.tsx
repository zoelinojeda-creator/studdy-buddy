import { useId, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

// Campo de texto estandar (.inp-field / .inp-plain en docs/css/app.css).
// label es opcional: si no se pasa, se usa como un input suelto.
// icon es opcional: emoji a la izquierda (.inp-ico). Se posiciona respecto
// del input mismo (no del grupo entero, como en la referencia), asi nada que
// se renderice debajo — p.ej. el medidor de contrasena — lo desplaza.
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: string
}

export function Input({ label, icon, id, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const classes = [styles.input, icon && styles.withIcon, className].filter(Boolean).join(' ')
  const input = <input id={inputId} className={classes} {...props} />

  const field = icon ? (
    <span className={styles.field}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      {input}
    </span>
  ) : (
    input
  )

  if (!label) return field

  return (
    <label className={styles.label} htmlFor={inputId}>
      {label}
      {field}
    </label>
  )
}
