import { CaretRight } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { LineChart } from '../components/LineChart'
import { ExTile, Segmented, TopBar } from '../components/ui'
import { liftHistory, type LiftPoint } from '../core/stats'
import type { Exercise, Unit } from '../core/types'
import { fmtNum, toDisplay } from '../core/units'
import { storage } from '../platform/storage'
import { setText } from './History'

const METRICS = ['Top weight', 'Volume', 'Best reps'] as const
type Metric = (typeof METRICS)[number]

function useLifts() {
  const sessions = useLiveQuery(storage.listSessions)
  const exercises = useLiveQuery(storage.listExercises)
  const unit = useLiveQuery(storage.getSettings)?.unit ?? 'kg'
  const lifts = useMemo(() => (sessions ? liftHistory(sessions) : undefined), [sessions])
  return { lifts, exercises, unit }
}

const metricValue = (p: LiftPoint, m: Metric, unit: Unit) =>
  m === 'Best reps' ? p.bestReps : toDisplay(m === 'Top weight' ? p.top : p.volume, unit)

/** Stats tab: every lift you've logged, with how it moved since the first time. */
export function Stats() {
  const nav = useNavigate()
  const { lifts, exercises, unit } = useLifts()
  if (!lifts || !exercises) return null
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const rows = [...lifts.entries()].sort((a, b) => b[1].at(-1)!.date - a[1].at(-1)!.date)

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-[18px] pb-3">
        <h1 className="text-[30px] leading-tight">Stats</h1>
        <p className="font-semibold text-muted">Tap a lift to see its graph</p>
      </header>
      <div className="stagger min-h-0 flex-1 space-y-1.5 overflow-y-auto px-[18px] pb-4">
        {rows.length === 0 && <p className="py-10 text-center font-semibold text-muted">Log a workout to start your stats.</p>}
        {rows.map(([id, points]) => {
          const ex = byId.get(id)
          const m: Metric = ex?.bodyweight ? 'Best reps' : 'Top weight'
          const first = metricValue(points[0], m, unit)
          const last = metricValue(points.at(-1)!, m, unit)
          const diff = Math.round((last - first) * 100) / 100
          return (
            <button key={id} onClick={() => nav(`/stats/${id}`)} className="row press flex w-full items-center gap-3 p-3 text-left">
              <ExTile id={id} emoji={ex?.emoji} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{ex?.name ?? 'Deleted exercise'}</div>
                <div className="truncate text-xs font-semibold text-muted">
                  {points.length} session{points.length === 1 ? '' : 's'} · last {setText(best(points.at(-1)!), ex, unit)}
                </div>
              </div>
              {points.length > 1 && (
                <span className={`chip tabular ${diff > 0 ? 'bg-healthy' : diff < 0 ? 'bg-people' : 'bg-[#26262b] text-muted'}`}>
                  {diff > 0 ? '+' : diff < 0 ? '−' : '±'}
                  {fmtNum(Math.abs(diff))}
                  {m === 'Best reps' ? ' reps' : ` ${unit}`}
                </span>
              )}
              <CaretRight className="text-muted" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Heaviest set of a session (ties: more reps). */
const best = (p: LiftPoint) => [...p.sets].sort((a, b) => b.weight - a.weight || b.reps - a.reps)[0]

/** One lift: line graph plus every session as a table. */
export function LiftStats() {
  const { id = '' } = useParams()
  const { lifts, exercises, unit } = useLifts()
  const ex = exercises?.find((e) => e.id === id)
  const [metric, setMetric] = useState<Metric | null>(null)
  if (!lifts || !exercises) return null
  const points = lifts.get(id) ?? []
  const m = metric ?? (ex?.bodyweight ? 'Best reps' : 'Top weight')
  const fmt = (v: number) => (m === 'Best reps' ? `${fmtNum(v)}` : `${fmtNum(Math.round(v * 10) / 10)} ${unit}`)

  return (
    <div className="flex h-full flex-col">
      <TopBar back="/stats" title={ex?.name ?? 'Lift'} right={<span className="mr-3">{ex && <ExTile id={id} emoji={ex.emoji} size={36} />}</span>} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-[18px] pb-4">
        <Segmented options={METRICS} value={m} onChange={setMetric} />
        <div className="row p-3 pt-4">
          {points.length > 1 ? (
            <LineChart key={m} points={points.map((p) => ({ x: p.date, y: metricValue(p, m, unit) }))} format={fmt} />
          ) : (
            <p className="py-10 text-center text-sm font-semibold text-muted">Log this lift once more to see a trend line.</p>
          )}
        </div>
        <p className="text-xs font-semibold text-muted">{explain(m, ex)}</p>
        <section>
          <h2 className="mb-2 text-lg">Sessions</h2>
          <div className="space-y-1.5">
            {[...points].reverse().map((p) => (
              <div key={p.date} className="row flex items-start gap-3 p-3">
                <div className="w-14 shrink-0">
                  <div className="font-extrabold">{new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                  <div className="text-xs font-semibold text-muted">
                    {p.sets.length} set{p.sets.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap gap-1">
                  {p.sets.map((x, i) => (
                    <span key={i} className="tabular rounded-lg bg-[#26262b] px-2 py-0.5 text-xs font-bold">
                      {setText(x, ex, unit)}
                    </span>
                  ))}
                </div>
                <div className="tabular shrink-0 text-right text-sm font-black">{fmt(metricValue(p, m, unit))}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function explain(m: Metric, ex?: Exercise) {
  if (m === 'Top weight') return ex?.equipment === 'dumbbell' || !ex?.equipment ? 'Heaviest set each session, per dumbbell.' : 'Heaviest set each session.'
  if (m === 'Volume') return 'Weight × reps, added up over all sets. Goes up when you do more total work.'
  return 'Most reps in a single set each session.'
}
