import styles from './PasswordMeter.module.css'

// Puerto de pwStr() (docs/js/screens/inicio.js): mismos 5 criterios, mismos
// colores y mismos textos (con ortografia correcta). A diferencia del
// original, la barra tiene un riel fijo detras del relleno, asi se ve igual
// desde el principio y no depende de que el ancho del propio elemento cambie.
const COLORES = ['#ff6b6b', '#ff9f43', '#f9c846', '#6ee7b7', '#6ee7b7']
const ETIQUETAS = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte']

function fuerza(pw: string): number {
  let s = 0
  if (pw.length >= 6) s++
  if (pw.length >= 10) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}

export function PasswordMeter({ value }: { value: string }) {
  const s = fuerza(value)
  const idx = Math.min(s - 1, 4)
  const color = s >= 1 ? COLORES[idx] : undefined
  const ancho = Math.min((s / 4) * 100, 100)
  const texto = value.length ? (s >= 1 ? ETIQUETAS[idx] : 'Muy débil') : 'Ingresa una contraseña'

  return (
    <div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${ancho}%`, background: color }} />
      </div>
      <div className={styles.label} style={{ color: value.length && color ? color : undefined }}>
        {texto}
      </div>
    </div>
  )
}
