import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { nearestIndex } from '../core/units'
import { haptics } from '../platform/haptics'

type Props = {
  values: number[]
  value: number
  onChange: (v: number) => void
  format: (v: number) => string
  itemH?: number
  rows?: number
  className?: string
  /** Hold to open a full-screen version of this wheel. */
  holdToZoom?: boolean
  label?: string
}

/** iOS-style scroll wheel: native momentum + scroll-snap, value settles when scrolling stops. */
export function Wheel({ values, value, onChange, format, itemH = 44, rows = 3, className = '', holdToZoom = true, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const idx = nearestIndex(values, value)
  const [active, setActive] = useState(idx)
  const [zoom, setZoom] = useState(false)
  const last = useRef(idx)
  const settle = useRef(0)
  const latest = useRef({ value, onChange, values })
  latest.current = { value, onChange, values }
  const hold = useHold(holdToZoom ? () => setZoom(true) : undefined)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (Math.round(el.scrollTop / itemH) !== idx) el.scrollTop = idx * itemH
    last.current = idx
    setActive(idx)
  }, [idx, itemH])

  useEffect(() => () => clearTimeout(settle.current), [])

  const onScroll = () => {
    const el = ref.current!
    const i = Math.min(values.length - 1, Math.max(0, Math.round(el.scrollTop / itemH)))
    if (i !== last.current) {
      last.current = i
      setActive(i)
      haptics.tick()
    }
    clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const l = latest.current
      if (l.values[i] !== l.value) l.onChange(l.values[i])
    }, 110)
  }

  const pad = ((rows - 1) / 2) * itemH
  return (
    <div className={`relative no-select ${className}`} style={{ height: rows * itemH }} {...hold}>
      <div className="absolute inset-x-0 rounded-xl bg-white/[0.07]" style={{ top: pad, height: itemH }} />
      <div
        ref={ref}
        onScroll={onScroll}
        className="wheel no-scrollbar relative h-full"
        style={{
          paddingBlock: pad,
          maskImage: 'linear-gradient(transparent, #000 30%, #000 70%, transparent)',
        }}
      >
        {values.map((v, i) => (
          <div
            key={v}
            onClick={() => ref.current?.scrollTo({ top: i * itemH, behavior: 'smooth' })}
            className={`tabular flex items-center justify-center transition-[color,transform] duration-150 ${
              i === active ? 'text-text scale-105 font-medium' : 'text-muted'
            }`}
            style={{ height: itemH, fontSize: itemH * 0.42 }}
          >
            {format(v)}
          </div>
        ))}
      </div>
      {createPortal(
        <AnimatePresence>
          {zoom && (
            <BigWheel values={values} value={value} onChange={onChange} format={format} label={label} onClose={() => setZoom(false)} />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

function BigWheel({ onClose, label, ...p }: Omit<Props, 'holdToZoom'> & { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      {label && <p className="mb-4 text-muted">{label}</p>}
      <motion.div
        className="relative flex w-full items-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        transition={{ duration: 0.2, ease: [0.3, 1.6, 0.5, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="absolute left-6 z-10 text-4xl text-attention" aria-hidden>
          ▸
        </span>
        <Wheel {...p} itemH={96} rows={5} holdToZoom={false} className="mx-auto w-64 [&_.tabular]:font-[Rubik]" />
      </motion.div>
      <p className="mt-6 text-sm text-muted">Flick to change · tap outside to close</p>
    </motion.div>
  )
}

function useHold(cb?: () => void, ms = 420) {
  const timer = useRef(0)
  const start = useRef({ x: 0, y: 0 })
  const cancel = () => clearTimeout(timer.current)
  if (!cb) return {}
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY }
      cancel()
      timer.current = window.setTimeout(() => {
        haptics.tap()
        cb()
      }, ms)
    },
    onPointerMove: (e: PointerEvent) => {
      if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 8) cancel()
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (e: { preventDefault(): void }) => e.preventDefault(),
  }
}
