import { useState, type PointerEvent } from 'react'

export type ChartPoint = { x: number; y: number } // x = date (ms)

const W = 340
const H = 190
const L = 40
const R = 14
const T = 16
const B = 26
const LINE = '#8FBF88' // deeper sage: passes 3:1 on the dark card
const shortDate = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** Single-series line chart, x by date. Tap or drag to read any point. */
export function LineChart({ points, format }: { points: ChartPoint[]; format: (v: number) => string }) {
  const [sel, setSel] = useState(points.length - 1)
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  // Round tick step (1, 2, 2.5, 5 × 10^n) so the axis reads 35 / 40 / 45, not 32.8 / 52.3.
  const lo = Math.min(...ys)
  const hi = Math.max(...ys)
  const raw = (hi - lo) / 3 || Math.max(1, hi * 0.1)
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!
  const y0 = Math.max(lo >= 0 ? 0 : -Infinity, Math.floor(lo / step) * step - (lo % step === 0 ? step : 0))
  const y1 = Math.ceil(hi / step) * step + (hi % step === 0 ? step : 0)

  const sx = (x: number) => (x1 === x0 ? (L + W - R) / 2 : L + ((x - x0) / (x1 - x0)) * (W - L - R))
  const sy = (y: number) => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B)
  const ticks = Array.from({ length: Math.round((y1 - y0) / step) + 1 }, (_, i) => y0 + i * step)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')

  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const vx = ((e.clientX - r.left) / r.width) * W
    let best = 0
    points.forEach((p, i) => {
      if (Math.abs(sx(p.x) - vx) < Math.abs(sx(points[best].x) - vx)) best = i
    })
    setSel(best)
  }

  const p = points[sel] ?? points.at(-1)!
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-none select-none"
        onPointerDown={pick}
        onPointerMove={(e) => e.buttons && pick(e)}
        role="img"
        aria-label={`Trend from ${format(points[0].y)} to ${format(points.at(-1)!.y)}`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={sy(t)} y2={sy(t)} stroke="#26262b" strokeWidth={1} />
            <text x={L - 6} y={sy(t) + 3.5} textAnchor="end" fontSize={10} fontWeight={700} fill="#8a8a8a">
              {format(t)}
            </text>
          </g>
        ))}
        <text x={L} y={H - 6} fontSize={10} fontWeight={700} fill="#8a8a8a">
          {shortDate(x0)}
        </text>
        {x1 !== x0 && (
          <text x={W - R} y={H - 6} textAnchor="end" fontSize={10} fontWeight={700} fill="#8a8a8a">
            {shortDate(x1)}
          </text>
        )}
        <line x1={sx(p.x)} x2={sx(p.x)} y1={T - 6} y2={H - B} stroke="#55555a" strokeWidth={1} strokeDasharray="3 3" />
        <path d={d} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((q, i) => (
          <circle
            key={q.x}
            cx={sx(q.x)}
            cy={sy(q.y)}
            r={i === sel ? 6 : 4}
            fill={LINE}
            stroke="#17171a"
            strokeWidth={2}
          />
        ))}
      </svg>
      <div
        className="pointer-events-none absolute rounded-lg bg-text px-2 py-1 text-xs font-extrabold whitespace-nowrap text-bg"
        style={{
          left: `${(sx(p.x) / W) * 100}%`,
          top: `${(sy(p.y) / H) * 100}%`,
          transform: `translate(${sx(p.x) > W * 0.75 ? '-90%' : sx(p.x) < W * 0.25 ? '-10%' : '-50%'}, -150%)`,
        }}
      >
        {shortDate(p.x)} · {format(p.y)}
      </div>
    </div>
  )
}
