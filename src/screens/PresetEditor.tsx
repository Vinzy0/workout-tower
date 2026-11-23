import { Check, DotsSixVertical, MagnifyingGlass, Plus, Trash, X } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, Reorder, useDragControls } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { Sheet } from '../components/Sheet'
import { Segmented, TopBar } from '../components/ui'
import { ExTile } from '../components/ExerciseIcon'
import { ValueCard } from '../components/ValueCard'
import { LIBRARY } from '../core/library'
import { EQUIPMENT, STEP_SIZES, type Equipment, type Exercise, type Preset, type Unit } from '../core/types'
import { equipmentOf, fmtNum, fmtWeight, REPS, toDisplay, toKg, weightLabel, weightValues } from '../core/units'
import { addToPreset, createCustomExercise, startSession } from '../data'
import { haptics } from '../platform/haptics'
import { storage } from '../platform/storage'

export function PresetEditor() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const preset = useLiveQuery(async () => (await storage.getPreset(id)) ?? null, [id])
  const exercises = useLiveQuery(storage.listExercises)
  const unit = useLiveQuery(storage.getSettings)?.unit ?? 'kg'
  const [order, setOrder] = useState<string[]>([])
  const [name, setName] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (preset) setOrder(preset.exerciseIds)
    if (preset === null || preset?.deleted) nav('/presets', { replace: true })
  }, [preset, nav])

  if (!preset || preset.deleted || !exercises) return null

  const byId = new Map(exercises.map((e) => [e.id, e]))
  const save = (patch: Partial<Preset>) => storage.putPreset({ ...preset, ...patch })
  const libOpen = params.get('add') === '1'
  const setLib = (open: boolean) => setParams(open ? { add: '1' } : {}, { replace: true })

  const remove = async () => {
    if (!confirm(`Delete "${preset.name}"? Past workouts stay in your history.`)) return
    await storage.deletePreset(preset.id)
    nav('/presets', { replace: true })
  }

  const start = async () => {
    haptics.tap()
    nav(`/workout/${await startSession(preset.id)}`)
  }

  return (
    <div className="flex h-full flex-col">
      <TopBar
        back="/presets"
        title={
          <input
            value={name ?? preset.name}
            onChange={(e) => {
              setName(e.target.value)
              save({ name: e.target.value || 'Untitled' })
            }}
            className="w-full rounded-lg bg-transparent py-1 outline-none focus:bg-surface focus:px-2"
            aria-label="Workout name"
          />
        }
        right={
          <button aria-label="Delete workout" onClick={remove} className="press grid h-11 w-11 place-items-center rounded-xl text-muted">
            <Trash size={20} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-[18px] pb-4">
        {order.length === 0 ? (
          <button onClick={() => setLib(true)} className="chunky mt-4 w-full rounded-[18px] bg-attention [--lip:#d9be55] p-5 text-left text-on-pastel">
            <div className="font-display text-lg font-medium">Add your exercises</div>
            <div className="text-sm opacity-80">Pick from {LIBRARY.length} moves. Takes a few seconds.</div>
          </button>
        ) : (
          <>
            <p className="mb-2 text-xs text-muted">Tap to set defaults · drag the handle to reorder</p>
            <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-1.5">
              {order.map((eid) => {
                const ex = byId.get(eid)
                if (!ex) return null
                return (
                  <ExerciseRow
                    key={eid}
                    ex={ex}
                    unit={unit}
                    open={openId === eid}
                    onToggle={() => setOpenId(openId === eid ? null : eid)}
                    onDrop={() => save({ exerciseIds: order })}
                    onRemove={() => save({ exerciseIds: order.filter((x) => x !== eid) })}
                  />
                )
              })}
            </Reorder.Group>
          </>
        )}
      </div>

      <div className="safe-bottom flex gap-2 px-[18px] pt-3">
        <button onClick={() => setLib(true)} className={`press h-14 rounded-xl ${order.length ? 'row flex-1' : 'btn-primary flex-1'}`}>
          <span className="inline-flex items-center gap-2">
            <Plus /> Add exercises
          </span>
        </button>
        {order.length > 0 && (
          <button onClick={start} className="btn-primary chunky h-14 flex-1">
            Start workout
          </button>
        )}
      </div>

      <LibrarySheet
        open={libOpen}
        onClose={() => setLib(false)}
        taken={order}
        custom={exercises.filter((e) => !e.id.startsWith('lib-'))}
        onAdd={async (ids) => {
          await addToPreset(preset.id, ids)
          setLib(false)
        }}
      />
    </div>
  )
}

function ExerciseRow({
  ex,
  unit,
  open,
  onToggle,
  onDrop,
  onRemove,
}: {
  ex: Exercise
  unit: Unit
  open: boolean
  onToggle: () => void
  onDrop: () => void
  onRemove: () => void
}) {
  const controls = useDragControls()
  const put = (patch: Partial<Exercise>) => storage.putExercise({ ...ex, ...patch })
  const values = useMemo(() => weightValues(ex.stepSize, unit), [ex.stepSize, unit])
  const w = fmtWeight(toDisplay(ex.defaultWeight, unit), ex.bodyweight)

  return (
    <Reorder.Item value={ex.id} dragListener={false} dragControls={controls} onDragEnd={onDrop} className="row overflow-hidden">
      <div className="flex items-center">
        <button
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="grid h-14 w-10 shrink-0 touch-none place-items-center text-muted"
        >
          <DotsSixVertical size={20} />
        </button>
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-4 text-left">
          <ExTile id={ex.id} ex={ex} size={40} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-extrabold">{ex.name}</span>
            <span className="tabular text-xs text-muted">
              {w}
              {ex.bodyweight && w === 'BW' ? '' : ` ${unit}`} × {ex.defaultReps} to start
            </span>
          </span>
        </button>
      </div>
      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 px-3 pb-3">
          <p className="text-xs font-semibold text-muted">First-time starting values. After that, each set starts from last time.</p>
          <div className="grid grid-cols-2 gap-2">
            <ValueCard
              values={values}
              value={toDisplay(ex.defaultWeight, unit)}
              onChange={(v) => put({ defaultWeight: toKg(v, unit) })}
              format={(v) => fmtWeight(v, ex.bodyweight)}
              caption={weightLabel(ex, unit)}
              title={`${ex.name} · starting weight`}
              raised
            />
            <ValueCard
              values={REPS}
              value={ex.defaultReps}
              onChange={(v) => put({ defaultReps: v })}
              format={String}
              caption="reps"
              title={`${ex.name} · starting reps`}
              raised
            />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Weight step ({unit})</div>
            <Segmented options={STEP_SIZES} value={ex.stepSize as (typeof STEP_SIZES)[number]} onChange={(s) => put({ stepSize: s })} format={fmtNum} />
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Weight is</div>
            <Segmented
              options={EQUIPMENT}
              value={equipmentOf(ex)}
              onChange={(e) => put({ equipment: e, bodyweight: e === 'bodyweight' })}
              format={(e) => EQUIPMENT_LABEL[e]}
            />
          </div>
          <button onClick={onRemove} className="press text-sm text-error underline underline-offset-[3px]">
            Remove from workout
          </button>
        </motion.div>
      )}
    </Reorder.Item>
  )
}

type LibItem = { id: string; name: string; emoji: string; group: string; bodyweight: boolean; equipment?: Equipment }

function LibrarySheet({
  open,
  onClose,
  taken,
  custom,
  onAdd,
}: {
  open: boolean
  onClose: () => void
  taken: string[]
  custom: Exercise[]
  onAdd: (ids: string[]) => void
}) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [making, setMaking] = useState(false)

  useEffect(() => {
    if (!open) {
      setPicked([])
      setQ('')
      setMaking(false)
    }
  }, [open])

  const items: LibItem[] = [...custom.map((c) => ({ ...c, group: 'Custom' })), ...LIBRARY]
  const query = q.trim().toLowerCase()
  const shown = items.filter((i) => !query || [i.name, i.group, equipmentOf(i)].some((t) => t.toLowerCase().includes(query)))
  const groups = [...new Set(shown.map((i) => i.group))]

  const toggle = (id: string) => {
    haptics.tap()
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  return (
    <Sheet open={open} onClose={onClose}>
      {making ? (
        <CustomForm
          initialName={q}
          onCancel={() => setMaking(false)}
          onSave={async (e) => {
            const id = await createCustomExercise(e)
            setPicked((p) => [...p, id])
            setMaking(false)
            setQ('')
          }}
        />
      ) : (
        <>
          <label className="mb-3 flex h-12 items-center gap-2 rounded-2xl bg-surface px-4">
            <MagnifyingGlass className="text-muted" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search exercises or muscle"
              className="h-full flex-1 bg-transparent outline-none placeholder:text-muted"
            />
            {q && (
              <button aria-label="Clear search" onClick={() => setQ('')} className="text-muted">
                <X />
              </button>
            )}
          </label>
          <div className="-mx-[18px] min-h-0 flex-1 overflow-y-auto px-[18px]">
            {groups.map((g) => (
              <div key={g} className="mb-3">
                <div className="mb-1 text-xs text-muted">{g}</div>
                <div className="space-y-1">
                  {shown
                    .filter((i) => i.group === g)
                    .map((i) => {
                      const added = taken.includes(i.id)
                      const on = picked.includes(i.id)
                      return (
                        <button
                          key={i.id}
                          disabled={added}
                          onClick={() => toggle(i.id)}
                          className={`row press flex w-full items-center gap-3 px-3 py-2.5 text-left ${added ? 'opacity-40' : ''}`}
                        >
                          <ExTile id={i.id} ex={i} size={36} />
                          <span className="flex-1">
                            {i.name}
                            {equipmentOf(i) !== 'dumbbell' && <span className="ml-2 text-xs text-muted">{equipmentOf(i)}</span>}
                          </span>
                          {added ? (
                            <span className="text-xs text-muted">Added</span>
                          ) : (
                            <span
                              className={`grid h-6 w-6 place-items-center rounded-full transition-all duration-200 ${
                                on ? 'scale-110 bg-healthy text-on-pastel' : 'bg-surface-hover'
                              }`}
                            >
                              {on && <Check size={14} weight="bold" />}
                            </span>
                          )}
                        </button>
                      )
                    })}
                </div>
              </div>
            ))}
            <button onClick={() => setMaking(true)} className="row press mb-3 flex w-full items-center gap-3 px-3 py-3 text-left">
              <Plus className="text-muted" />
              <span>{query ? `Custom exercise "${q.trim()}"` : 'Custom exercise'}</span>
            </button>
          </div>
          <button
            disabled={picked.length === 0}
            onClick={() => onAdd(picked)}
            className="btn-primary chunky mt-2 h-14 w-full shrink-0 disabled:opacity-40"
          >
            {picked.length ? `Add ${picked.length} exercise${picked.length > 1 ? 's' : ''}` : 'Tap exercises to pick'}
          </button>
        </>
      )}
    </Sheet>
  )
}

function CustomForm({
  initialName,
  onSave,
  onCancel,
}: {
  initialName: string
  onSave: (e: Pick<Exercise, 'name' | 'stepSize' | 'equipment'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName.trim())
  const [stepSize, setStep] = useState<(typeof STEP_SIZES)[number]>(2.5)
  const [equipment, setEquipment] = useState<Equipment>('dumbbell')

  return (
    <div className="space-y-3 pb-2">
      <h2 className="text-xl">Custom exercise</h2>
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="h-12 flex-1 rounded-2xl bg-surface px-4 outline-none placeholder:text-muted"
        />
      </div>
      <div>
        <div className="mb-1 text-xs text-muted">Weight step</div>
        <Segmented options={STEP_SIZES} value={stepSize} onChange={setStep} format={fmtNum} />
      </div>
      <div>
        <div className="mb-1 text-xs text-muted">Weight is</div>
        <Segmented options={EQUIPMENT} value={equipment} onChange={setEquipment} format={(e) => EQUIPMENT_LABEL[e]} />
        <p className="mt-1 text-xs text-muted">{EQUIPMENT_HINT[equipment]}</p>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel} className="row press h-14 flex-1">
          Cancel
        </button>
        <button
          disabled={!name.trim()}
          onClick={() => onSave({ name: name.trim(), stepSize, equipment })}
          className="btn-primary chunky h-14 flex-1 disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  )
}

const EQUIPMENT_LABEL: Record<Equipment, string> = { dumbbell: 'Dumbbell', cable: 'Cable', barbell: 'Barbell', bodyweight: 'Body' }
const EQUIPMENT_HINT: Record<Equipment, string> = {
  dumbbell: 'Logged per dumbbell (kg each).',
  cable: 'Cable or machine: the stack/pin weight.',
  barbell: 'Total bar + plates.',
  bodyweight: 'BW at 0, extra weight above it.',
}
