import { motion } from 'motion/react'
import { useState } from 'react'
import { createPortal } from 'react-dom'

const COLORS = ['#C3DDBF', '#EEDC9A', '#BFD3F0', '#F2CDB2', '#CFC3F0', '#ECEBE8']

/** One burst of pastel confetti falling from the top. */
export function Confetti({ count = 46 }: { count?: number }) {
  const [pieces] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      x: Math.random() * 100,
      drift: (Math.random() - 0.5) * 120,
      spin: (Math.random() - 0.5) * 720,
      delay: Math.random() * 0.35,
      dur: 1.6 + Math.random() * 1.2,
      w: 6 + Math.random() * 6,
      round: i % 3 === 0,
      color: COLORS[i % COLORS.length],
    })),
  )
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0"
          style={{
            left: `${p.x}%`,
            width: p.w,
            height: p.round ? p.w : p.w * 1.8,
            background: p.color,
            borderRadius: p.round ? 999 : 2,
          }}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: p.drift, rotate: p.spin, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.dur, delay: p.delay, ease: [0.25, 0.4, 0.6, 1] }}
        />
      ))}
    </div>,
    document.body,
  )
}
