import { Check, Minus, Plus, Trash } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from '../components/toast'
import { TopBar } from '../components/ui'
import { Wheel } from '../components/Wheel'
import type { Entry, Exercise, Session, Unit } from '../core/types'
import { fmtWeight, REPS, toDisplay, toKg, weightValues } from '../core/units'
import { nextSet } from '../data'
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
    nav('/', { replace: true, state: { finished: true } })
  }

  const discard = async () => {
    if (!confirm('Discard this workout?')) return
    await storage.deleteSession(s.id)
    nav('/', { replace: true })
  }

  const entry = s.entries.find((e) => e.exerciseId === sel)
  const ex = sel ? byId.get(sel) : undefined

  return (
    <div className="flex h-full flex-col">
      <TopBar
        title={presetName ?? 'Workout'}
        right={
          <div className="flex items-center gap-1">
            <span className="tabular mr-1 text-sm text-muted">
              {doneCount}/{s.entries.length}
            </span>
            <button aria-label="Discard workout" onClick={discard} className="press grid h-11 w-11 place-items-center rounded-xl text-muted">
              <Trash size={20} />
            </button>
          </div>
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-[42%_58%]">
        <ExercisePicker
          entries={s.entries}
          byId={byId}
          selected={sel}
          onSelect={(id) => {
            haptics.tap()
            setSel(id)
          }}
        />
        <div className="min-h-0 overflow-y-auto pl-2 pr-[18px]">
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
            <div className="grid h-full place-items-center px-4 text-center text-sm text-muted">Tap an exercise to log it</div>
          )}
        </div>
      </div>

      <div className="safe-bottom px-[18px] pt-3">
        <button onClick={finish} className="btn-primary press h-14 w-full text-base">
          Finish workout
        </button>
        <button
          onClick={() => {
            toast('Saved. Resume from Start workout.')
            nav('/')
          }}
          className="mt-1 h-10 w-full text-sm text-muted"
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
  const ITEM = 72

  useEffect(() => {
    const i = entries.findIndex((e) => e.exerciseId === selected)
    if (i >= 0) ref.current?.scrollTo({ top: i * ITEM, behavior: 'smooth' })
  }, [selected, entries])

  return (
    <div className="relative min-h-0">
      <div className="pointer-events-none absolute inset-x-2 top-1/2 h-[72px] -translate-y-1/2 rounded-2xl bg-surface" />
      <div
        ref={ref}
        className="wheel no-scrollbar relative flex h-full flex-col"
        style={{ maskImage: 'linear-gradient(transparent, #000 25%, #000 75%, transparent)' }}
      >
        <div className="shrink-0" style={{ height: `calc(50% - ${ITEM / 2}px)`, scrollSnapAlign: 'none' }} />
        {entries.map((e) => {
          const ex = byId.get(e.exerciseId)
          const on = e.exerciseId === selected
          return (
            <button
              key={e.exerciseId}
              onClick={() => onSelect(e.exerciseId)}
              className={`no-select flex shrink-0 items-center gap-2 pl-4 pr-3 text-left transition-colors ${on ? 'text-text' : 'text-muted'}`}
              style={{ height: ITEM }}
            >
              <span className={`text-2xl transition-transform ${on ? 'scale-110' : ''}`}>{ex?.emoji ?? '❔'}</span>
              <span className={`line-clamp-2 flex-1 text-sm leading-tight ${e.done ? 'line-through decoration-faint' : ''}`}>
                {ex?.name ?? 'Deleted exercise'}
              </span>
              {e.done && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-healthy text-on-pastel"
                >
                  <Check size={12} weight="bold" />
                </motion.span>
              )}
            </button>
          )
        })}
        <div className="shrink-0" style={{ height: `calc(50% - ${ITEM / 2}px)`, scrollSnapAlign: 'none' }} />
      </div>
    </div>
  )
}

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
  const setAt = (i: number, patch: Partial<Entry['sets'][number]>) =>
    onChange((e) => ({ ...e, sets: e.sets.map((x, j) => (j === i ? { ...x, ...patch } : x)) }))

  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="pb-4">
      <div className="mb-2 flex items-center gap-2 pt-1">
        <span className="text-2xl">{ex.emoji}</span>
        <h2 className="line-clamp-2 text-lg leading-tight">{ex.name}</h2>
      </div>
      <div className="mb-1 grid grid-cols-[18px_1fr_1fr] gap-1.5 text-center text-xs text-muted">
        <span />
        <span>{ex.bodyweight ? `+${unit}` : `${unit} each`}</span>
        <span>reps</span>
      </div>
      <div className="space-y-2">
        {entry.sets.map((set, i) => (
          <div key={i} className="grid grid-cols-[18px_1fr_1fr] items-center gap-1.5">
            <span className="tabular text-center text-xs text-muted">{i + 1}</span>
            <Wheel
              values={values}
              value={toDisplay(set.weight, unit)}
              onChange={(v) => setAt(i, { weight: toKg(v, unit) })}
              format={(v) => fmtWeight(v, ex.bodyweight)}
              itemH={36}
              label={`Set ${i + 1} · ${ex.bodyweight ? `added ${unit}` : `${unit} each`}`}
            />
            <Wheel values={REPS} value={set.reps} onChange={(v) => setAt(i, { reps: v })} format={String} itemH={36} label={`Set ${i + 1} · reps`} />
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-[11px] text-muted">Hold a number to zoom</p>
      <div className="mt-2 flex gap-1.5">
        <button
          onClick={() => onChange((e) => ({ ...e, sets: [...e.sets, nextSet(history, ex, e)] }))}
          className="row press flex h-12 flex-1 items-center justify-center gap-1.5 text-sm"
        >
          <Plus size={16} /> Add set
        </button>
        {entry.sets.length > 1 && (
          <button
            aria-label="Remove last set"
            onClick={() => onChange((e) => ({ ...e, sets: e.sets.slice(0, -1) }))}
            className="row press grid h-12 w-12 place-items-center text-muted"
          >
            <Minus size={16} />
          </button>
        )}
      </div>
      <button
        onClick={() => onDone(!entry.done)}
        className={`press mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-xl font-[Rubik] font-medium transition-colors ${
          entry.done ? 'bg-healthy text-on-pastel' : 'bg-surface text-text'
        }`}
      >
        <Check size={18} weight="bold" /> {entry.done ? 'Done' : 'Mark done'}
      </button>
    </motion.div>
  )
}
