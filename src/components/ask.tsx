import { useSyncExternalStore } from 'react'
import { Sheet } from './Sheet'

// In-app "are you sure?" sheet. Replaces window.confirm(), which some browsers and installed
// apps block (it then silently returns false, so nothing happens).
type Question = { message: string; yes: string; danger: boolean; resolve: (ok: boolean) => void }

let current: Question | null = null
const subs = new Set<() => void>()
const set = (q: Question | null) => {
  current = q
  subs.forEach((f) => f())
}

export function ask(message: string, yes = 'Delete', danger = true): Promise<boolean> {
  current?.resolve(false)
  return new Promise((resolve) => set({ message, yes, danger, resolve }))
}

export function AskHost() {
  const q = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => current,
  )
  const answer = (ok: boolean) => {
    q?.resolve(ok)
    set(null)
  }
  return (
    <Sheet open={!!q} onClose={() => answer(false)}>
      <p className="mt-2 mb-5 text-lg font-extrabold whitespace-pre-line">{q?.message}</p>
      <div className="flex gap-2 pb-2">
        <button onClick={() => answer(false)} className="row chunky h-14 flex-1 font-extrabold [--lip:#26262b] [--lip-h:3px]">
          Cancel
        </button>
        <button
          onClick={() => answer(true)}
          className={`chunky h-14 flex-1 rounded-2xl font-black ${q?.danger ? 'bg-error text-on-pastel [--lip:#a8483c]' : 'btn-primary'}`}
        >
          {q?.yes}
        </button>
      </div>
    </Sheet>
  )
}
