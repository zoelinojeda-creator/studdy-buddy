// Puerto de floatEmoji() (docs/js/utils.js): un emoji aparece sobre Mindy y
// se borra del DOM apenas termina el rebote (no hay fade de opacidad en el
// original, el elemento se remueve de golpe a los 900ms). Funcion global,
// no un componente — para que Ropero/Cuidado puedan dispararla desde
// adentro de un modal sin prop-drilling, igual que en la app vieja.
export function floatEmoji(icon: string): void {
  const el = document.createElement('div')
  el.innerHTML = icon

  let left = window.innerWidth / 2 - 20
  let top = window.innerHeight / 2

  const mindy = document.querySelector('[data-mindy-anchor]')
  if (mindy) {
    const rect = mindy.getBoundingClientRect()
    left = rect.left + rect.width / 2 - 20
    top = rect.top + rect.height / 2 - 20
  }

  el.style.cssText = `position:fixed;left:${left}px;top:${top}px;font-size:2rem;z-index:400;pointer-events:none;animation:floatEmojiBounce .9s ease forwards;`
  document.body.appendChild(el)
  setTimeout(() => {
    try {
      document.body.removeChild(el)
    } catch {
      // ya removido (p.ej. si el usuario navego lejos mientras corria el timeout)
    }
  }, 900)
}
