import { Camera, CaretLeft, CaretRight, Check, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { ask } from '../components/ask'
import { ExTile } from '../components/ExerciseIcon'
import { Sheet } from '../components/Sheet'
import { Segmented } from '../components/ui'
import { performed } from '../core/stats'
import { computeTower } from '../core/tower'
import type { Exercise, Preset, Session, SetEntry, Unit } from '../core/types'
import { fmtWeight, toDisplay } from '../core/units'
import { pickPhoto, resize } from '../platform/camera'
import { storage } from '../platform/storage'

export function setText(x: SetEntry, ex: Exercise | undefined, unit: Unit) {
  const bw = !!ex?.bodyweight
  const w = fmtWeight(toDisplay(x.weight, unit), bw)
  return `${w}${bw && x.weight === 0 ? '' : ` ${unit}`} × ${x.reps}`
}

const dayKey = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

async function addPhoto(sessionId: string) {
  const raw = await pickPhoto('library')
  if (!raw) return
  const [full, thumb] = await Promise.all([resize(raw, 1280), resize(raw, 240, true)])
  await storage.putPhoto(sessionId, full, thumb)
}

export function History() {
  const sessions = useLiveQuery(storage.listSessions)
  const exercises = useLiveQuery(storage.listExercises)
  const presets = useLiveQuery(storage.listPresets)
  const goals = useLiveQuery(storage.listGoals)
  const thumbs = useLiveQuery(storage.listThumbs)
  const unit = useLiveQuery(storage.getSettings)?.unit ?? 'kg'
  const [view, setView] = useState<'Calendar' | 'List'>('Calendar')
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  })
  const [day, setDay] = useState<string | null>(null)
  const [viewing, setViewing] = useState<string | null>(null)

  const done = useMemo(() => (sessions ?? []).filter((s) => s.finished).sort((a, b) => b.date - a.date), [sessions])
  if (!sessions || !exercises || !presets || !thumbs || !goals) return null
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const card = (s: Session) => (
    <SessionCard key={s.id} s={s} byId={byId} presets={presets} unit={unit} thumb={thumbs.get(s.id)} onView={() => setViewing(s.id)} />
  )
  const daySessions = day ? done.filter((s) => dayKey(s.date) === day) : []

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-[18px] pb-3">
        <div className="flex items-end justify-between">
          <h1 className="text-[30px] leading-tight">History</h1>
          <span className="pb-1 font-bold text-muted">
            {done.length} workout{done.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="mt-2">
          <Segmented options={['Calendar', 'List'] as const} value={view} onChange={setView} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-4">
        {view === 'Calendar' ? (
          <MonthView
            month={month}
            setMonth={setMonth}
            done={done}
            thumbs={thumbs}
            streak={computeTower(done.map((s) => s.date), goals, Date.now()).height}
            onPick={setDay}
          />
        ) : (
          <div className="stagger space-y-3">
            {done.length === 0 && <p className="py-10 text-center font-semibold text-muted">Finish a workout and it shows up here.</p>}
            {done.map(card)}
          </div>
        )}
      </div>

      <Sheet open={!!day && daySessions.length > 0} onClose={() => setDay(null)}>
        <div className="min-h-0 space-y-3 overflow-y-auto pt-2 pb-2">{daySessions.map(card)}</div>
      </Sheet>
      <PhotoViewer id={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

/** Month grid with photo thumbnails. Fits one phone screen so it can be screenshotted for a diary. */
function MonthView({
  month,
  setMonth,
  done,
  thumbs,
  streak,
  onPick,
}: {
  month: number
  setMonth: (m: number) => void
  done: Session[]
  thumbs: Map<string, string>
  streak: number
  onPick: (dayKey: string) => void
}) {
  const m = new Date(month)
  const y = m.getFullYear()
  const mo = m.getMonth()
  const offset = (m.getDay() + 6) % 7
  const days = new Date(y, mo + 1, 0).getDate()
  const inMonth = done.filter((s) => new Date(s.date).getFullYear() === y && new Date(s.date).getMonth() === mo)
  const byDay = new Map<string, Session[]>()
  for (const s of inMonth) byDay.set(dayKey(s.date), [...(byDay.get(dayKey(s.date)) ?? []), s])
  const photos = inMonth.filter((s) => thumbs.has(s.id)).length
  const today = dayKey(Date.now())
  const shift = (n: number) => setMonth(new Date(y, mo + n, 1).getTime())

  return (
    <div className="row p-4">
      <div className="mb-3 flex items-center">
        <button aria-label="Previous month" onClick={() => shift(-1)} className="press grid h-10 w-10 place-items-center rounded-xl text-muted">
          <CaretLeft size={20} weight="bold" />
        </button>
        <h2 className="flex-1 text-center text-2xl">{m.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <button aria-label="Next month" onClick={() => shift(1)} className="press grid h-10 w-10 place-items-center rounded-xl text-muted">
          <CaretRight size={20} weight="bold" />
        </button>
      </div>
      <div className="mb-3 flex justify-center gap-1.5">
        <span className="chip bg-healthy">{inMonth.length} workouts</span>
        <span className="chip bg-people">{photos} photos</span>
        {streak > 0 && <span className="chip bg-attention">Week {streak} streak</span>}
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="pb-1 text-[11px] font-black text-muted">
            {d}
          </span>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const key = `${y}-${mo}-${i + 1}`
          const list = byDay.get(key)
          const thumb = list?.map((s) => thumbs.get(s.id)).find(Boolean)
          return (
            <button
              key={key}
              disabled={!list}
              onClick={() => onPick(key)}
              className={`press relative aspect-square overflow-hidden rounded-[10px] ${
                list ? (thumb ? '' : 'bg-healthy text-on-pastel') : 'bg-[#1f1f23] text-faint'
              } ${key === today ? 'ring-2 ring-text ring-offset-2 ring-offset-surface' : ''}`}
            >
              {thumb && <img src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <span
                className={`absolute top-0.5 left-1 text-[10px] font-black ${thumb ? 'rounded bg-black/55 px-0.5 text-white' : ''}`}
              >
                {i + 1}
              </span>
              {list && !thumb && <Check size={16} weight="bold" className="absolute right-1 bottom-1" />}
              {list && list.length > 1 && (
                <span className="absolute right-0.5 bottom-0.5 rounded bg-black/55 px-0.5 text-[9px] font-black text-white">×{list.length}</span>
              )}
            </button>
          )
        })}
      </div>
      {photos > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-1.5">
          {inMonth
            .filter((s) => thumbs.has(s.id))
            .slice(0, 8)
            .map((s) => (
              <img key={s.id} src={thumbs.get(s.id)} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ))}
        </div>
      )}
      <p className="mt-3 text-center text-[11px] font-bold text-faint">tower · tap a day for details</p>
    </div>
  )
}

function SessionCard({
  s,
  byId,
  presets,
  unit,
  thumb,
  onView,
}: {
  s: Session
  byId: Map<string, Exercise>
  presets: Preset[]
  unit: Unit
  thumb?: string
  onView: () => void
}) {
  const d = new Date(s.date)
  return (
    <article className="row p-4">
      <div className="mb-3 flex items-center gap-3">
        {thumb ? (
          <button onClick={onView} className="press shrink-0">
            <img src={thumb} alt="Workout photo" className="h-14 w-14 rounded-2xl object-cover" />
          </button>
        ) : (
          <button
            aria-label="Add a photo"
            onClick={() => addPhoto(s.id)}
            className="press grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-white/15 text-muted"
          >
            <Camera size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl leading-tight">{d.toLocaleDateString(undefined, { weekday: 'long' })}</h2>
          <div className="truncate text-sm font-bold text-muted">
            {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {presets.find((p) => p.id === s.presetId)?.name ?? 'Workout'}
          </div>
        </div>
        <button
          aria-label="Delete this workout"
          onClick={async () => {
            if (await ask(`Delete the ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} workout?\nYour tower and stats update.`))
              storage.deleteSession(s.id)
          }}
          className="press -mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted"
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
}

function PhotoViewer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const photo = useLiveQuery(async () => (id ? storage.getPhoto(id) : undefined), [id])
  return (
    <Sheet open={!!id} onClose={onClose}>
      {photo && <img src={photo} alt="Workout photo" className="mt-2 mb-3 max-h-[70dvh] w-full rounded-3xl object-contain" />}
      {id && (
        <div className="flex gap-2 pb-2">
          <button onClick={() => addPhoto(id)} className="row chunky h-12 flex-1 font-extrabold [--lip:#26262b] [--lip-h:3px]">
            Replace
          </button>
          <button
            onClick={async () => {
              if (await ask('Remove this photo?', 'Remove')) {
                await storage.deletePhoto(id)
                onClose()
              }
            }}
            className="row chunky h-12 flex-1 font-extrabold text-error [--lip:#26262b] [--lip-h:3px]"
          >
            Remove
          </button>
        </div>
      )}
    </Sheet>
  )
}
