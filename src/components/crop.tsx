import { MagnifyingGlassMinus, MagnifyingGlassPlus } from '@phosphor-icons/react'
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { haptics } from '../platform/haptics'

// Quick in-app crop for the profile photo: drag to move, pinch or slider to zoom, round preview.
// Usage: const avatar = await crop(dataUrl)  // null if cancelled

type Job = { src: string; resolve: (v: string | null) => void }
let job: Job | null = null
const subs = new Set<() => void>()
const set = (j: Job | null) => {
  job = j
  subs.forEach((f) => f())
}

export function crop(src: string): Promise<string | null> {
  job?.resolve(null)
  return new Promise((resolve) => set({ src, resolve }))
}

export function CropHost() {
  const j = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => job,
  )
  if (!j) return null
  return createPortal(
    <Cropper
      key={j.src}
      src={j.src}
      onDone={(v) => {
        j.resolve(v)
        set(null)
      }}
    />,
    document.body,
  )
}

const OUT = 256 // saved avatar size (px)
const MAX_ZOOM = 4

function Cropper({ src, onDone }: { src: string; onDone: (v: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [V, setV] = useState(300) // viewport size (px)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // image center offset from viewport center (px)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ d: number; z: number } | null>(null)

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = src
  }, [src])
  useEffect(() => {
    if (box.current) setV(box.current.clientWidth)
  }, [img])

  if (!img) return null
  const base = Math.max(V / img.width, V / img.height) // "cover" the circle at zoom 1
  const k = base * zoom
  const w = img.width * k
  const h = img.height * k
  const clamp = (p: { x: number; y: number }, kk = k) => {
    const mx = Math.max(0, (img.width * kk - V) / 2)
    const my = Math.max(0, (img.height * kk - V) / 2)
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) }
  }
  const setZoomTo = (z: number) => {
    const nz = Math.max(1, Math.min(MAX_ZOOM, z))
    setZoom(nz)
    setPos((p) => clamp({ x: (p.x * nz) / zoom, y: (p.y * nz) / zoom }, base * nz))
  }

  const down = (e: PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* synthetic event */
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }
    }
  }
  const move = (e: PointerEvent) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      setZoomTo((pinch.current.z * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.d)
    } else if (pointers.current.size === 1) {
      setPos((p) => clamp({ x: p.x + e.clientX - prev.x, y: p.y + e.clientY - prev.y }))
    }
  }
  const up = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  const save = () => {
    haptics.success()
    const c = document.createElement('canvas')
    c.width = c.height = OUT
    const side = V / k // visible square, in image pixels
    const sx = img.width / 2 - pos.x / k - side / 2
    const sy = img.height / 2 - pos.y / k - side / 2
    c.getContext('2d')!.drawImage(img, sx, sy, side, side, 0, 0, OUT, OUT)
    onDone(c.toDataURL('image/jpeg', 0.88))
  }

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-[80] flex flex-col items-center bg-bg px-[18px]" style={{ animation: 'zoomIn 180ms ease both' }}>
      <h2 className="mt-6 text-2xl">Move and zoom</h2>
      <p className="mt-1 text-sm font-semibold text-muted">Drag to center your face. Pinch or use the slider to zoom.</p>
      <div className="flex w-full flex-1 items-center justify-center">
        <div
          ref={box}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="relative aspect-square w-[min(82vw,340px)] touch-none select-none"
          style={{ cursor: 'grab' }}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
            style={{ width: w, height: h, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
          />
          {/* Dim everything outside the circle; the circle is what gets saved. */}
          <div className="pointer-events-none absolute inset-0 rounded-full" style={{ boxShadow: '0 0 0 100vmax rgba(13,13,15,.78)', outline: '3px solid #ecebe8' }} />
        </div>
      </div>
      <div className="mb-5 flex w-full items-center gap-3">
        <MagnifyingGlassMinus size={20} className="text-muted" />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoomTo(Number(e.target.value))}
          aria-label="Zoom"
          className="h-2 flex-1 accent-[#c3ddbf]"
        />
        <MagnifyingGlassPlus size={20} className="text-muted" />
      </div>
      <div className="flex w-full gap-2 pb-2">
        <button onClick={() => onDone(null)} className="row chunky h-14 flex-1 font-extrabold [--lip:#26262b] [--lip-h:3px]">
          Cancel
        </button>
        <button onClick={save} className="btn-primary chunky h-14 flex-1">
          Use photo
        </button>
      </div>
    </div>
  )
}
