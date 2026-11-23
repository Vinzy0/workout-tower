import { useLiveQuery } from 'dexie-react-hooks'
import { TopBar } from '../components/ui'
import { addWeeks, computeTower, materialFor } from '../core/tower'
import { storage } from '../platform/storage'

const fmt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

export function PastTowers() {
  const sessions = useLiveQuery(storage.listSessions)
  const goals = useLiveQuery(storage.listGoals)
  if (!sessions || !goals) return null
  const t = computeTower(
    sessions.filter((s) => s.finished).map((s) => s.date),
    goals,
    Date.now(),
  )
  const past = [...t.pastTowers].reverse()

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Past towers" />
      <div className="flex-1 space-y-1.5 overflow-y-auto px-[18px] pb-6">
        <p className="mb-3 text-muted">
          Best: <span className="tabular text-text">{t.best} weeks</span>
        </p>
        {past.length === 0 && <p className="py-8 text-center text-muted">No collapsed towers. Keep it that way.</p>}
        {past.map((p) => (
          <div key={p.start} className="row flex items-center gap-4 px-4 py-3">
            <div className={`slab slab-${materialFor(p.height)} grid h-12 w-12 shrink-0 place-items-center font-display text-lg font-bold`} style={{ boxShadow: 'none' }}>
              {p.height}
            </div>
            <div>
              <div>{p.height} weeks tall</div>
              <div className="text-xs text-muted">
                {fmt(p.start)} to {fmt(addWeeks(p.end, 1) - 1)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
