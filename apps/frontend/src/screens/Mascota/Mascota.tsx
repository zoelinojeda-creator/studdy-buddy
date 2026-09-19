import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../store/useAuthStore'
import { toast } from '../../store/useToastStore'
import { useRoperoStore } from '../../store/useRoperoStore'
import { useCuidadoStore } from '../../store/useCuidadoStore'
import { useEstudioStore } from '../../store/useEstudioStore'
import { ACCESSORIES } from '../../data/accessories'
import { NECESIDAD_LABEL, type Necesidad } from '../../data/items'
import { MindyStage } from '../../components/MindyStage'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Ropero } from '../Ropero/Ropero'
import { Cuidado } from '../Cuidado/Cuidado'
import anim from '../../styles/animations.module.css'
import styles from './Mascota.module.css'

// Mensajes de poke() (docs/js/screens/mascota.js).
const POKES = ['¡Ay!', '¡Cuidado!', '¡Hehe!', '¡Epa!']

// Las otras 3 necesidades de Cuidado, mostradas ahora siempre en .arena
// junto a la barra de Hambre (alimentacion) que ya estaba ahi.
const OTRAS_NECESIDADES: Necesidad[] = ['diversion', 'descanso', 'higiene']

function NeedBar({ necesidad, valor }: { necesidad: Necesidad; valor: number }) {
  const { nombre, icono } = NECESIDAD_LABEL[necesidad]
  return (
    <div className={styles.needRow}>
      <div className={styles.needLabel}>
        <span>
          {icono} {nombre}
        </span>
        <span>{valor}%</span>
      </div>
      <div className={styles.needTrack}>
        <div className={styles.needFill} style={{ width: `${valor}%` }} />
      </div>
    </div>
  )
}

// Mismo mapeo que ACT_LABEL en docs/js/screens/mascota.js.
const ACT_LABEL: Record<string, string> = {
  flash: 'Flashcards',
  rapid: 'Quiz Rapido',
  quiz: 'Quiz',
  complete: 'Completar',
}

// Mismos breakpoints que renderHunger() en docs/js/screens/mascota.js.
function moodDe(hunger: number): string {
  if (hunger > 70) return '😊 Feliz'
  if (hunger > 40) return '😐 Normal'
  if (hunger > 15) return '😟 Con hambre'
  return '😢 Hambrienta!'
}

// Mismas 4 metas que goals-grid en docs/index.html.
const GOALS: { id: string; icono: string; nombre: string; desc: string }[] = [
  { id: 'casual', icono: '🏖️', nombre: 'Casual', desc: 'Una vez al dia' },
  { id: 'normal', icono: '📘', nombre: 'Normal', desc: 'Un rato al dia' },
  { id: 'intenso', icono: '🔥', nombre: 'Intenso', desc: 'Varias veces' },
  { id: 'extremo', icono: '⚡', nombre: 'Extremo', desc: 'Constante' },
]

// Mismo mapeo que GOAL_HINT en docs/js/data.js.
const GOAL_HINT: Record<string, string> = {
  casual: 'Relajado — sin comer, Mindy estara muy hambrienta en 24 horas',
  normal: 'Equilibrado — sin comer, Mindy estara muy hambrienta en 6 horas',
  intenso: 'Desafiante — sin comer, Mindy estara muy hambrienta en 2 horas',
  extremo: 'Extremo — sin comer, Mindy estara muy hambrienta en 20 minutos',
}

interface MascotaProps {
  onIrAPerfil: () => void
  onIrAEstudiar: () => void
  onIrAAulas: () => void
}

type ModalAbierto = 'ropero' | 'cuidado' | null

export function Mascota(props: MascotaProps) {
  const profile = useAuthStore((s) => s.profile)
  const authMode = useAuthStore((s) => s.authMode)

  const roperoLoaded = useRoperoStore((s) => s.loaded)
  const loadRopero = useRoperoStore((s) => s.loadState)
  const equippedAccessory = useRoperoStore((s) => s.equippedAccessory)

  const cuidadoLoaded = useCuidadoStore((s) => s.loaded)
  const loadCuidado = useCuidadoStore((s) => s.loadState)
  const valores = useCuidadoStore((s) => s.valores)
  const alimentacion = valores.alimentacion
  const goal = useCuidadoStore((s) => s.goal)
  const setGoal = useCuidadoStore((s) => s.setGoal)

  const historial = useEstudioStore((s) => s.historial)
  const cargarHistorial = useEstudioStore((s) => s.cargarHistorial)
  const borrarHistorial = useEstudioStore((s) => s.borrarHistorial)

  const [histAbierto, setHistAbierto] = useState(false)
  const [modalAbierto, setModalAbierto] = useState<ModalAbierto>(null)
  const [poking, setPoking] = useState(false)
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const userId = profile?.id

  useEffect(() => () => clearTimeout(pokeTimer.current), [])

  // Puerto de poke() (docs/js/screens/mascota.js): Mindy hace "scare" (.5s)
  // y sale un toast al azar.
  function poke() {
    setPoking(true)
    clearTimeout(pokeTimer.current)
    pokeTimer.current = setTimeout(() => setPoking(false), 500)
    toast(POKES[Math.floor(Math.random() * POKES.length)])
  }

  useEffect(() => {
    if (userId && !roperoLoaded) loadRopero(userId)
  }, [userId, roperoLoaded, loadRopero])

  useEffect(() => {
    if (userId && !cuidadoLoaded) loadCuidado(userId)
  }, [userId, cuidadoLoaded, loadCuidado])

  useEffect(() => {
    if (userId) cargarHistorial(userId)
  }, [userId, cargarHistorial])

  const equipped = ACCESSORIES.find((a) => a.id === equippedAccessory)

  if (!profile) {
    return (
      <div className={styles.wrap}>
        <p className={styles.hint}>Cargando...</p>
      </div>
    )
  }

  const xpNecesario = profile.level * 100
  const xpPct = Math.min((profile.xp / xpNecesario) * 100, 100)

  return (
    <div className={styles.mascota}>
      <div className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <span className={styles.nombre}>Hola, {profile.username}!</span>
          <Button variant="secondary" onClick={() => window.alert('Tutorial próximamente')}>
            💡 Tutorial
          </Button>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.xpChip}>⭐ {profile.xp} XP</span>
          <Button variant="secondary" onClick={props.onIrAPerfil}>
            🙂 Perfil
          </Button>
          {authMode !== 'guest' && (
            <Button variant="secondary" onClick={props.onIrAAulas}>
              🏫 Aulas
            </Button>
          )}
        </div>
      </div>

      <div className={styles.colLeft}>
        <div className={styles.arena}>
          <div className={styles.coinsRow}>
            <div className={styles.coin}>
              ⭐<span className={styles.coinLbl}>+10</span>
            </div>
            <div className={styles.coin}>
              ⭐<span className={styles.coinLbl}>+20</span>
            </div>
            <div className={styles.coin}>
              ⭐<span className={styles.coinLbl}>+30</span>
            </div>
          </div>
          <div className={styles.monsterWrap} onClick={poke}>
            <div
              data-mindy-anchor
              className={poking ? `${styles.pokeTarget} ${anim.scare}` : styles.pokeTarget}
            >
              <MindyStage accessory={equipped} nivel={profile.level} />
            </div>
            <div className={styles.mName}>
              Mindy <span className={styles.lvlBadge}>Nv.{profile.level}</span>
            </div>
          </div>
          <div className={styles.hWrap}>
            <div className={styles.hRow}>
              <span>🦴 Hambre</span>
              <span>{Math.round(alimentacion)}%</span>
            </div>
            <div className={styles.hTrack}>
              <div className={styles.hFill} style={{ width: `${alimentacion}%` }} />
            </div>
          </div>
          <div className={styles.mood}>{moodDe(alimentacion)}</div>

          <div className={styles.needBars}>
            {OTRAS_NECESIDADES.map((necesidad) => (
              <NeedBar key={necesidad} necesidad={necesidad} valor={valores[necesidad]} />
            ))}
          </div>
        </div>

        <div className={styles.xpRow}>
          <span className={styles.xpRowIcon}>⭐</span>
          <div className={styles.xpBarW}>
            <div className={styles.xpLbl}>
              <span>Nivel {profile.level}</span>
              <span>
                {profile.xp} / {xpNecesario} XP
              </span>
            </div>
            <div className={styles.xpTrack}>
              <div className={styles.xpFill} style={{ width: `${xpPct}%` }} />
            </div>
            <div className={styles.xpHint}>prox. nivel</div>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <div className={styles.statVal}>{profile.sessions}</div>
            <div className={styles.statLbl}>Sesiones</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statVal}>{profile.xp}</div>
            <div className={styles.statLbl}>XP Total</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statVal}>{profile.streak}</div>
            <div className={styles.statLbl}>Racha 🔥</div>
          </div>
        </div>

        <div className={styles.adChico}>
          <div className={styles.adLabel}>Espacio publicitario</div>
        </div>
      </div>

      <div className={styles.colRight}>
        <div className={styles.rightTop}>
          <div className={styles.goalsGrid}>
            {GOALS.map((g) => (
              <button
                key={g.id}
                type="button"
                className={g.id === goal ? `${styles.gBtn} ${styles.gBtnOn}` : styles.gBtn}
                onClick={() => userId && setGoal(userId, g.id)}
              >
                <span className={styles.gIco}>{g.icono}</span>
                <span className={styles.gName}>{g.nombre}</span>
                <span className={styles.gDesc}>{g.desc}</span>
              </button>
            ))}
          </div>
          <div className={styles.goalHint}>{GOAL_HINT[goal] ?? GOAL_HINT.normal}</div>

          <div className={styles.navGrid}>
            <button type="button" className={styles.navBtn} onClick={() => setModalAbierto('ropero')}>
              <span className={styles.navIco}>👕</span>
              <span>Ropero</span>
            </button>
            <button type="button" className={styles.navBtn} onClick={() => setModalAbierto('cuidado')}>
              <span className={styles.navIco}>🍎</span>
              <span>Cuidado</span>
            </button>
            <button type="button" className={styles.navBtn} onClick={props.onIrAEstudiar}>
              <span className={styles.navIco}>📚</span>
              <span>Estudiar</span>
            </button>
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.adStack}>
            <div className={styles.adBig}>
              <div className={styles.adLabelBig}>Espacio publicitario</div>
            </div>

            <div className={styles.igCard}>
              <div className={styles.igTitle}>📸 Encontraste un bug o tenes una idea?</div>
              <div className={styles.igSub}>Contanos en Instagram</div>
              <a
                className={styles.igBtn}
                href="https://www.instagram.com/studdybuddy_oficial?igsi=azc1ZzdraDc0dm9s"
                target="_blank"
                rel="noopener"
              >
                @studdybuddy_oficial
              </a>
            </div>
          </div>

          <div className={styles.histSection}>
            <div className={styles.histHeader} onClick={() => setHistAbierto((v) => !v)}>
              <div className={styles.histTitle}>📚 Temas estudiados</div>
              <button type="button" className={styles.histToggle}>
                {histAbierto ? '▲ ocultar' : '▼ ver'}
              </button>
            </div>
            {histAbierto && (
              <div className={styles.histBody}>
                {historial.length === 0 ? (
                  <div className={styles.histEmpty}>Todavia no estudiaste ningun tema 📚</div>
                ) : (
                  <>
                    {historial.map((h, i) => (
                      <div key={i} className={styles.histItem}>
                        <div className={styles.histLeft}>
                          <div className={styles.histMateria}>{h.materia}</div>
                          <div className={styles.histTema}>{h.tema}</div>
                          <div className={styles.histMeta}>
                            {ACT_LABEL[h.actividad] || h.actividad} • {h.fecha}
                          </div>
                        </div>
                        <div className={styles.histRight}>
                          <div className={h.porcentaje >= 70 ? styles.histPctGood : styles.histPctBad}>
                            {h.porcentaje}%
                          </div>
                          <div className={styles.histXp}>+{h.xp} XP</div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className={styles.histClear} onClick={borrarHistorial}>
                      🗑 Borrar historial
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={styles.petSpacer} />
      </div>

      {modalAbierto === 'ropero' && (
        <Modal onClose={() => setModalAbierto(null)}>
          <Ropero onClose={() => setModalAbierto(null)} />
        </Modal>
      )}
      {modalAbierto === 'cuidado' && (
        <Modal onClose={() => setModalAbierto(null)}>
          <Cuidado onClose={() => setModalAbierto(null)} />
        </Modal>
      )}
    </div>
  )
}
