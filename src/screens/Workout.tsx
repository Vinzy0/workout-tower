import { ask } from '../components/ask'
import { CaretLeft, Check, Plus, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from '../components/toast'
import { groupColor, groupOf } from '../core/library'
import { EquipmentGlyph } from '../components/ExerciseIcon'
import { ValueCard } from '../components/ValueCard'
import type { Entry, Exercise, Session, Unit } from '../core/types'
import { equipmentOf, fmtWeight, REPS, toDisplay, toKg, weightLabel, weightValues } from '../core/units'
import { lastSets, nextSet } from '../data'
import { haptics } from '../platform/haptics'
import { storage } from '../platform/storage'
import { syncAfterWorkout } from '../sync'

export function Workout() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const stored = useLiveQuery(async () => (await storage.getSession(id)) ?? null, [id])
  const exercises = useLiveQuery(storage.listExercises)
  const history = useLiveQuery(storage.listSessions)
  const unit = useLiveQuery(storage.getSettings)?.unit ?? 'kg'
  const presetName = useLiveQuery(async () => (stored ? (await storage.getPreset(stored.presetId))?.name : undefined), [stored?.presetId])
  const [s, setS] = useState<Session | null>(null)
  const [sel, setSel] = useState<string | null>(null)

  // Local copy is the UI's source of truth; every change is autosaved.
  useEffect(() => {
    if (stored && !s) setS(stored)
    if (stored === null || stored?.deleted) nav('/', { replace: true })
  }, [stored, s, nav])

  if (!s || !exercises || !history) return null
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const doneCount = s.entries.filter((e) => e.done).length

  const update = (fn: (s: Session) => Session) => {
    setS((prev) => {
      const next = fn(prev!)
      storage.putSession(next)
      return next
    })
  }
  const updateEntry = (exerciseId: string, fn: (e: Entry) => Entry) =>
    update((x) => ({ ...x, entries: x.entries.map((e) => (e.exerciseId === exerciseId ? fn(e) : e)) }))

  const finish = async () => {
    haptics.success()
    const done = { ...s, finished: true, date: Date.now() }
    await storage.putSession(done)
    syncAfterWorkout() // runs inside this tap so a token refresh is allowed
    nav('/', { replace: true })
  }

  const discard = async () => {
    if (!(await ask('Discard this workout?', 'Discard'))) return
    await storage.deleteSession(s.id)
    nav('/', { replace: true })
  }

  const entry = s.entries.find((e) => e.exerciseId === sel)
  const ex = sel ? byId.get(sel) : undefined
  const pct = s.entries.length ? (doneCount / s.entries.length) * 100 : 0

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-[10px]">
        <div className="flex items-center gap-1">
          <button aria-label="Back" onClick={() => nav('/')} className="press grid h-11 w-11 place-items-center rounded-xl">
            <CaretLeft size={22} />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-2xl">{presetName ?? 'Workout'}</h1>
          <span className="tabular text-sm font-bold text-muted">
            {doneCount} of {s.entries.length} done
          </span>
          <button aria-label="Discard workout" onClick={discard} className="press grid h-11 w-11 place-items-center rounded-xl text-muted">
            <Trash size={20} />
          </button>
        </div>
        <div className="bar mx-2 mt-1" style={{ height: 10 }}>
          <div className="bg-healthy" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 pt-2">
        <ExercisePicker
          entries={s.entries}
          byId={byId}
          selected={sel}
          onSelect={(id) => {
            haptics.tap()
            setSel(id)
          }}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pl-1 pr-4">
          {entry && ex ? (
            <SetEditor
              key={ex.id}
              ex={ex}
              entry={entry}
              unit={unit}
              history={history}
              onChange={(fn) => updateEntry(ex.id, fn)}
              onDone={(done) => {
                updateEntry(ex.id, (e) => ({ ...e, done }))
                if (done) {
                  haptics.success()
                  const next = s.entries.find((e) => !e.done && e.exerciseId !== ex.id)
                  if (next) setTimeout(() => setSel(next.exerciseId), 350)
                }
              }}
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center font-bold text-muted">Tap an exercise to log it</div>
          )}
        </div>
      </div>

      <div className="safe-bottom px-[18px] pt-2">
        <button onClick={finish} className="btn-primary chunky h-14 w-full text-base">
          Finish workout
        </button>
        <button
          onClick={() => {
            toast('Saved. Resume from Start workout.')
            nav('/')
          }}
          className="h-9 w-full text-sm font-semibold text-muted"
        >
          Leave and keep draft
        </button>
      </div>
    </div>
  )
}

function ExercisePicker({
  entries,
  byId,
  selected,
  onSelect,
}: {
  entries: Entry[]
  byId: Map<string, Exercise>
  selected: string | null
  onSelect: (id: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const ITEM = 104

  useEffect(() => {
    const i = entries.findIndex((e) => e.exerciseId === selected)
    if (i >= 0) ref.current?.scrollTo({ top: i * ITEM, behavior: 'smooth' })
  }, [selected, entries.length]) // not on every set change, or the list jumps back while you scroll it

  return (
    <div className="relative min-h-0 w-[104px] shrink-0">
      <div
        ref={ref}
        className="wheel no-scrollbar flex h-full flex-col"
        style={{ maskImage: 'linear-gradient(transparent, #000 22%, #000 78%, transparent)' }}
      >
        <div className="shrink-0" style={{ height: `calc(50% - ${ITEM / 2}px)`, scrollSnapAlign: 'none' }} />
        {entries.map((e) => {
          const ex = byId.get(e.exerciseId)
          const on = e.exerciseId === selected
          return (
            <button
              key={e.exerciseId}
              onClick={() => onSelect(e.exerciseId)}
              className="no-select flex shrink-0 flex-col items-center justify-center gap-1.5"
              style={{ height: ITEM }}
            >
              <span
                className={`relative grid h-16 w-16 place-items-center rounded-[20px] text-3xl transition-all duration-200 ${
                  on ? '' : 'scale-90 opacity-60'
                }`}
                style={{
                  background: groupColor(e.exerciseId),
                  boxShadow: on ? '0 0 0 3px #0d0d0f, 0 0 0 6px #ecebe8' : 'inset 0 -4px 0 rgba(0,0,0,.18)',
                }}
              >
                <EquipmentGlyph equipment={ex ? equipmentOf(ex) : 'dumbbell'} size={32} />
                {e.done && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                    className="absolute -right-1.5 -bottom-1.5 grid h-[24px] w-[24px] place-items-center rounded-full bg-healthy text-on-pastel"
                    style={{ border: '3px solid #0d0d0f' }}
                  >
                    <Check size={11} weight="bold" />
                  </motion.span>
                )}
              </span>
              <span className={`line-clamp-2 w-24 text-center text-[11px] leading-tight font-extrabold ${on ? 'text-text' : 'text-muted'}`}>
                {ex?.name ?? 'Deleted'}
              </span>
            </button>
          )
        })}
        <div className="shrink-0" style={{ height: `calc(50% - ${ITEM / 2}px)`, scrollSnapAlign: 'none' }} />
      </div>
    </div>
  )
}


/** One set at a time: the active set gets the big cards, earlier sets sit above as chips you can tap. */
function SetEditor({
  ex,
  entry,
  unit,
  history,
  onChange,
  onDone,
}: {
  ex: Exercise
  entry: Entry
  unit: Unit
  history: Session[]
  onChange: (fn: (e: Entry) => Entry) => void
  onDone: (done: boolean) => void
}) {
  const values = useMemo(() => weightValues(ex.stepSize, unit), [ex.stepSize, unit])
  const [active, setActive] = useState(entry.sets.length - 1)
  const a = Math.max(0, Math.min(active, entry.sets.length - 1))
  const set = entry.sets[a]
  const setAt = (i: number, patch: Partial<Entry['sets'][number]>) =>
    onChange((e) => ({ ...e, sets: e.sets.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))
  const short = (x: Entry['sets'][number]) => `${fmtWeight(toDisplay(x.weight, unit), ex.bodyweight)}×${x.reps}`
  const last = lastSets(history, ex.id)?.map(short).join(', ')

  const addSet = () => {
    haptics.tap()
    onChange((e) => ({ ...e, sets: [...e.sets, nextSet(history, ex, e)] }))
    setActive(entry.sets.length)
  }
  const removeSet = () => {
    onChange((e) => ({ ...e, sets: e.sets.filter((_, j) => j !== a) }))
    setActive(Math.max(0, a - 1))
  }

  return (
    <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }} className="pb-4">
      <div className="flex flex-col gap-1.5 pt-1 pb-3">
        <span className="chip self-start" style={{ background: groupColor(ex.id) }}>
          {groupOf(ex.id)}
        </span>
        <h2 className="text-[22px] leading-tight">{ex.name}</h2>
        <span className="text-[13px] font-semibold text-muted">{last ? `Last time: ${last}` : 'First time. Starting from your defaults.'}</span>
      </div>

      {entry.sets.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {entry.sets.map((x, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`press tabular rounded-lg px-2 py-1 text-xs font-extrabold ${i === a ? 'bg-text text-bg' : 'bg-[#26262b] text-muted'}`}
            >
              {i + 1} · {short(x)}
            </button>
          ))}
        </div>
      )}

      {set && (
        <>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-black">Set {a + 1}</span>
            {entry.sets.length > 1 && (
              <button onClick={removeSet} className="text-xs font-bold text-muted underline underline-offset-[3px]">
                Remove set
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ValueCard
              values={values}
              value={toDisplay(set.weight, unit)}
              onChange={(v) => setAt(a, { weight: toKg(v, unit) })}
              format={(v) => fmtWeight(v, ex.bodyweight)}
              caption={weightLabel(ex, unit)}
              title={`${ex.name} · set ${a + 1}`}
            />
            <ValueCard
              values={REPS}
              value={set.reps}
              onChange={(v) => setAt(a, { reps: v })}
              format={String}
              caption="reps"
              title={`${ex.name} · set ${a + 1}`}
            />
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold text-muted">Hold a number, drag up or down, let go</p>
        </>
      )}

      <button
        onClick={addSet}
        className="row chunky mt-3 flex h-14 w-full items-center justify-center gap-1.5 font-extrabold [--lip:#26262b] [--lip-h:3px]"
      >
        <Plus size={16} weight="bold" /> {set ? `Next set (${entry.sets.length + 1})` : 'Add a set'}
      </button>
      <button
        onClick={() => onDone(!entry.done)}
        className={`chunky mt-1 flex h-16 w-full items-center justify-center gap-2 rounded-[20px] font-display text-lg font-black transition-colors ${
          entry.done ? 'bg-healthy text-on-pastel [--lip:#8fbf88]' : 'bg-surface text-text [--lip:#26262b]'
        }`}
      >
        <Check size={20} weight="bold" /> {entry.done ? 'Done' : 'Mark exercise done'}
      </button>
    </motion.div>
  )
}
