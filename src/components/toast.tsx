import { AnimatePresence, motion } from 'motion/react'
import { useSyncExternalStore } from 'react'

let current: { id: number; text: string } | null = null
const subs = new Set<() => void>()
let n = 0

export function toast(text: string, ms = 2200) {
  const id = ++n
  current = { id, text }
  subs.forEach((f) => f())
  setTimeout(() => {
    if (current?.id !== id) return
    current = null
    subs.forEach((f) => f())
  }, ms)
}

export function Toaster() {
  const t = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => current,
  )
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center safe-top">
      <AnimatePresence>
        {t && (
          <motion.div
            key={t.id}
            className="mt-2 rounded-full bg-text px-4 py-2 font-display text-sm font-extrabold text-bg"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {t.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
