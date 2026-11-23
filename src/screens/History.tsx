import { ask } from '../components/ask'
import { Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ExTile } from '../components/ExerciseIcon'
import { performed } from '../core/stats'
import type { Exercise, SetEntry, Unit } from '../core/types'
import { fmtWeight, toDisplay } from '../core/units'
import { storage } from '../platform/storage'

export function setText(x: SetEntry, ex: Exercise | undefined, unit: Unit) {
  const bw = !!ex?.bodyweight
  const w = fmtWeight(toDisplay(x.weight, unit), bw)
  return `${w}${bw && x.weight === 0 ? '' : ` ${unit}`} × ${x.reps}`
}

export function History() {
  const sessions = useLiveQuery(storage.listSessions)
  const exercises = useLiveQuery(storage.listExercises)
  const presets = useLiveQuery(storage.listPresets)
  const unit = useLiveQuery(storage.getSettings)?.unit ?? 'kg'
  if (!sessions || !exercises || !presets) return null

  const byId = new Map(exercises.map((e) => [e.id, e]))
  const done = sessions.filter((s) => s.finished).sort((a, b) => b.date - a.date)

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-[18px] pb-3">
        <h1 className="text-[30px] leading-tight">History</h1>
        <p className="font-semibold text-muted">
          {done.length} workout{done.length === 1 ? '' : 's'} logged
        </p>
      </header>
      <div className="stagger min-h-0 flex-1 space-y-3 overflow-y-auto px-[18px] pb-4">
        {done.length === 0 && <p className="py-10 text-center font-semibold text-muted">Finish a workout and it shows up here.</p>}
        {done.map((s) => {
          const d = new Date(s.date)
          return (
            <article key={s.id} className="row p-4">
              <div className="mb-3 flex items-baseline gap-2">
                <h2 className="text-xl">{d.toLocaleDateString(undefined, { weekday: 'long' })}</h2>
                <span className="text-sm font-bold text-muted">{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                <span className="ml-auto truncate text-sm font-bold text-muted">{presets.find((p) => p.id === s.presetId)?.name}</span>
                <button
                  aria-label="Delete this workout"
                  onClick={async () => {
                    if (await ask(`Delete the ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} workout?
Your tower and stats update.`))
                      storage.deleteSession(s.id)
                  }}
                  className="press -my-2 -mr-2 grid h-10 w-10 shrink-0 place-items-center self-center rounded-xl text-muted"
                >
                  <Trash size={18} />
                </button>
              </div>
              <div className="space-y-3">
                {performed(s).map((e) => {
                  const ex = byId.get(e.exerciseId)
                  return (
                    <div key={e.exerciseId} className="flex gap-3">
                      <ExTile id={e.exerciseId} ex={ex} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-extrabold">{ex?.name ?? 'Deleted exercise'}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {e.sets.map((x, i) => (
                            <span key={i} className="tabular rounded-lg bg-[#26262b] px-2 py-0.5 text-xs font-bold">
                              {setText(x, ex, unit)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
