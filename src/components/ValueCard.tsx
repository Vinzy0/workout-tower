import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import { createPortal } from 'react-dom'
import { fmtNum, nearestIndex } from '../core/units'
import { haptics } from '../platform/haptics'

type Props = {
  values: number[]
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
  caption: string // "kg each", "reps"
  title: string // shown on the zoomed view, e.g. "Lat pulldown · set 2"
  /** Lighter card, for use on top of a row. */
  raised?: boolean
}

const PX = 44 // finger travel per step
const ROW = 92 // spacing of numbers on the zoomed view

type Drag = { i0: number; y0: number; pos: number; open: boolean; last: number; samples: { t: number; p: number }[]; timer: number }
type Zoom = { pos: number; phase: 'open' | 'settle' | 'closing' }

/**
 * Hold a number: it zooms to full screen. Drag up/down to change it, let go to set it.
 * A flick keeps it spinning a little. Mouse wheel and arrow keys work on a laptop.
 */
export function ValueCard({ values, value, onChange, format, caption, title, raised = false }: Props) {
  const idx = nearestIndex(values, value)
  const [zoom, setZoom] = useState<Zoom | null>(null)
  const [pressed, setPressed] = useState(false)
  const drag = useRef<Drag | null>(null)
  const raf = useRef(0)
  const timers = useRef<number[]>([])
  const wheelAcc = useRef(0)
  const latest = useRef({ values, onChange })
  latest.current = { values, onChange }

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      timers.current.forEach(clearTimeout)
    },
    [],
  )
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const apply = (p: number) => {
    const d = drag.current!
    d.pos = p
    const i = Math.min(latest.current.values.length - 1, Math.max(0, d.i0 + Math.round(p)))
    if (i !== d.last) {
      d.last = i
      haptics.tick()
      latest.current.onChange(latest.current.values[i])
    }
    setZoom((z) => z && { ...z, pos: p })
  }

  const open = () => {
    const d = drag.current
    if (!d || d.open) return
    d.open = true
    haptics.tap()
    setZoom({ pos: 0, phase: 'open' })
  }

  const settle = () => {
    const d = drag.current
    if (!d) return
    setZoom((z) => z && { ...z, pos: d.last - d.i0, phase: 'settle' })
    later(() => {
      setZoom((z) => z && { ...z, phase: 'closing' })
      later(() => {
        setZoom(null)
        drag.current = null
      }, 180)
    }, 170)
  }

  const momentum = (vel: number) => {
    let last = performance.now()
    const lo = -drag.current!.i0
    const hi = latest.current.values.length - 1 - drag.current!.i0
    const tick = (now: number) => {
      const d = drag.current
      if (!d) return
      const dt = Math.min(40, now - last)
      last = now
      let p = d.pos + vel * dt
      vel *= 0.93 ** (dt / 16)
      if (p <= lo || p >= hi) {
        p = Math.max(lo, Math.min(hi, p))
        vel = 0
      }
      apply(p)
      if (Math.abs(vel) > 0.0007) raf.current = requestAnimationFrame(tick)
      else settle()
    }
    raf.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    cancelAnimationFrame(raf.current)
    timers.current.forEach(clearTimeout)
    timers.current = []
    try {
      e.currentTarget.setPointerCapture(e.pointerId) // keep getting moves when the finger leaves the card
    } catch {
      /* not capturable (synthetic event) */
    }
    drag.current = { i0: idx, y0: e.clientY, pos: 0, open: false, last: idx, samples: [{ t: performance.now(), p: 0 }], timer: 0 }
    drag.current.timer = window.setTimeout(open, 160)
    setPressed(true)
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const dy = d.y0 - e.clientY
    if (!d.open) {
      if (Math.abs(dy) < 6) return
      clearTimeout(d.timer)
      open()
    }
    const lo = -d.i0
    const hi = latest.current.values.length - 1 - d.i0
    let p = dy / PX
    if (p < lo) p = lo - Math.min(0.4, (lo - p) * 0.3) // rubber band past the ends
    if (p > hi) p = hi + Math.min(0.4, (p - hi) * 0.3)
    const t = performance.now()
    d.samples.push({ t, p })
    while (d.samples.length > 2 && t - d.samples[0].t > 90) d.samples.shift()
    apply(p)
  }

  const onPointerUp = () => {
    setPressed(false)
    const d = drag.current
    if (!d) return
    clearTimeout(d.timer)
    if (!d.open) {
      drag.current = null
      return
    }
    const a = d.samples[0]
    const z = d.samples.at(-1)!
    // Only fling if the finger was still moving when it let go; a pause means "this number".
    const moving = performance.now() - z.t < 60
    const vel = moving && z.t - a.t > 8 ? (z.p - a.p) / (z.t - a.t) : 0
    if (Math.abs(vel) > 0.004) momentum(vel * 0.9)
    else settle()
  }

  const step = (dir: number) => {
    const i = Math.min(values.length - 1, Math.max(0, idx + dir))
    if (i !== idx) {
      haptics.tick()
      onChange(values[i])
    }
  }
  const onWheel = (e: WheelEvent) => {
    wheelAcc.current += e.deltaY
    if (Math.abs(wheelAcc.current) < 30) return
    step(wheelAcc.current < 0 ? 1 : -1)
    wheelAcc.current = 0
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') step(1)
    else if (e.key === 'ArrowDown') step(-1)
    else return
    e.preventDefault()
  }

  const prev = values[idx - 1]
  const next = values[idx + 1]
  return (
    <>
      <button
        type="button"
        aria-label={`${title}: ${format(values[idx])}. Hold and drag to change.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
        className={`no-select flex h-[108px] w-full touch-none flex-col items-center justify-center rounded-[18px] transition-[transform,background] duration-150 ${
          pressed ? 'scale-[.96] bg-surface-hover' : raised ? 'bg-[#26262b]' : 'bg-surface'
        }`}
        style={{ boxShadow: 'inset 0 -3px 0 rgba(255,255,255,.05)', cursor: 'ns-resize' }}
      >
        <span className="text-[10px] font-black tracking-wide text-muted">{caption}</span>
        <span className="tabular h-[18px] text-sm font-bold text-faint">{prev === undefined ? '' : format(prev)}</span>
        <span className="tabular font-display text-[30px] leading-none font-black">{format(values[idx])}</span>
        <span className="tabular h-[18px] text-sm font-bold text-faint">{next === undefined ? '' : format(next)}</span>
      </button>
      {zoom &&
        drag.current &&
        createPortal(<ZoomView zoom={zoom} i0={drag.current.i0} values={values} format={format} title={title} caption={caption} />, document.body)}
    </>
  )
}

function ZoomView({
  zoom,
  i0,
  values,
  format,
  title,
  caption,
}: {
  zoom: Zoom
  i0: number
  values: number[]
  format: (v: number) => string
  title: string
  caption: string
}) {
  const base = Math.round(zoom.pos)
  const items = []
  for (let j = base - 5; j <= base + 5; j++) {
    const i = i0 + j
    if (i < 0 || i >= values.length) continue
    const d = j - zoom.pos
    const ad = Math.min(Math.abs(d), 4.5)
    items.push(
      <span
        key={i}
        className={`tabular absolute inset-x-0 top-1/2 -mt-[50px] flex h-[100px] items-center justify-center font-display text-[88px] font-black tracking-tight ${
          Math.abs(d) < 0.5 ? 'text-text' : 'text-[#7a7a7a]'
        }`}
        style={{
          transform: `translateY(${(d * ROW).toFixed(1)}px) scale(${(1 - Math.min(ad, 4) * 0.17).toFixed(3)})`,
          opacity: Math.max(0, 1 - ad * 0.24),
          transition: zoom.phase === 'settle' ? 'transform 170ms cubic-bezier(.2,.8,.2,1), opacity 170ms ease' : 'none',
        }}
      >
        {format(values[i])}
      </span>,
    )
  }
  const now = Math.min(values.length - 1, Math.max(0, i0 + base))
  const diff = Math.round((values[now] - values[i0]) * 100) / 100

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 flex flex-col bg-bg/[.97]"
      style={{ animation: zoom.phase === 'closing' ? 'zoomOut 180ms ease both' : 'zoomIn 180ms cubic-bezier(.2,.8,.2,1) both' }}
    >
      <div className="safe-top flex flex-col items-center gap-1 px-6 pt-14">
        <span className="text-sm font-extrabold text-muted">{title}</span>
        <span className="text-xl font-black text-attention">{caption}</span>
      </div>
      <div
        className="relative flex-1 overflow-hidden"
        style={{ maskImage: 'linear-gradient(transparent, #000 22%, #000 78%, transparent)' }}
      >
        <span className="absolute inset-x-5 top-1/2 -mt-[52px] h-[104px] rounded-[30px] bg-surface" />
        <span className="absolute top-1/2 left-8 -mt-5 text-4xl font-black text-attention" style={{ animation: 'nudge 1.1s ease-in-out infinite' }}>
          ›
        </span>
        {items}
      </div>
      <div className="flex flex-col items-center gap-2.5 px-6 pb-14">
        <span className={`chip px-3.5 py-1.5 text-[15px] ${diff > 0 ? 'bg-healthy' : diff < 0 ? 'bg-people' : 'bg-surface text-muted'}`}>
          {diff === 0 ? 'Same as before' : `${diff > 0 ? '+' : '−'}${fmtNum(Math.abs(diff))}`}
        </span>
        <span className="text-[13px] font-bold text-muted">Drag up or down. Let go to set it.</span>
      </div>
    </div>
  )
}
