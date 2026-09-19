import { useEffect, useRef } from 'react'
import styles from './BgCanvas.module.css'

// Puerto de docs/js/bgCanvas.js: fondo de estrellas + particulas que corre
// por encima de todas las pantallas. Se monta una sola vez en App.tsx (fuera
// de la maquina de estados de "screen") para que nunca se pare al navegar —
// por eso el efecto de montaje corre una unica vez ([] de dependencias) en
// vez de por pantalla, como hacia startBgCanvas/stopBgCanvas en la app vieja.

interface Star {
  x: number
  y: number
  r: number
  a: number
  spd: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  col: string
  a: number
}

const PARTICLE_COLORS = ['#f9c846', '#ff6b6b', '#6ee7b7', '#a78bfa', '#60a5fa']

export function BgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return

    cv.width = window.innerWidth
    cv.height = window.innerHeight

    const stars: Star[] = []
    for (let i = 0; i < 110; i++) {
      stars.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, r: Math.random() * 1.4 + 0.3, a: Math.random(), spd: Math.random() * 0.018 + 0.004 })
    }
    const particles: Particle[] = []
    for (let j = 0; j < 26; j++) {
      particles.push({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        r: Math.random() * 2.5 + 1,
        col: PARTICLE_COLORS[j % 5],
        a: Math.random() * 0.3 + 0.1,
      })
    }

    let mx = -999
    let my = -999
    function onMouseMove(e: MouseEvent) {
      mx = e.clientX
      my = e.clientY
    }
    document.addEventListener('mousemove', onMouseMove)

    let raf = 0
    function draw() {
      raf = requestAnimationFrame(draw)
      cv!.width = window.innerWidth
      cv!.height = window.innerHeight
      ctx!.clearRect(0, 0, cv!.width, cv!.height)

      for (const s of stars) {
        s.a += s.spd
        if (s.a > 1 || s.a < 0) s.spd *= -1
        ctx!.beginPath()
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(232,234,246,${Math.abs(s.a)})`
        ctx!.fill()
      }

      for (const p of particles) {
        const dx = p.x - mx
        const dy = p.y - my
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 95) {
          p.vx += (dx / d) * 0.38
          p.vy += (dy / d) * 0.38
        }
        p.vx *= 0.982
        p.vy *= 0.982
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = cv!.width
        if (p.x > cv!.width) p.x = 0
        if (p.y < 0) p.y = cv!.height
        if (p.y > cv!.height) p.y = 0
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = p.col
        ctx!.globalAlpha = p.a
        ctx!.fill()
        ctx!.globalAlpha = 1
      }
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.bgCanvas} />
}
