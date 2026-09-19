import { useId, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

// Campo de texto estandar (.inp-field / .inp-plain en docs/css/app.css).
// label es opcional: si no se pasa, se usa como un input suelto.
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, id, className, ...props }: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const input = <input id={inputId} className={[styles.input, className].filter(Boolean).join(' ')} {...props} />

  if (!label) return input

  return (
    <label className={styles.label} htmlFor={inputId}>
      {label}
      {input}
    </label>
  )
}
