import { ask } from '../components/ask'
import { Check, Flag, PencilSimple, Plus, ShieldCheck } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react"
import { Navigate, useNavigate } from 'react-router'
import { Avatar } from '../components/Avatar'
import { ExTile } from '../components/ExerciseIcon'
import { Sheet } from '../components/Sheet'
import { toast } from '../components/toast'
import { computeTower, materialFor, MILESTONES, nextMilestone, TIER_START, type Block, type TowerState } from '../core/tower'
import { createPreset, daysAgo, startSession } from '../data'
import { haptics } from '../platform/haptics'
import { storage } from '../platform/storage'
import { getDriveState } from '../sync'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function Home() {
  const nav = useNavigate()
  const sessions = useLiveQuery(storage.listSessions)
  const goals = useLiveQuery(storage.listGoals)
  const presets = useLiveQuery(storage.listPresets)
  const exercises = useLiveQuery(storage.listExercises)
  const drive = useLiveQuery(getDriveState)
  const [startOpen, setStartOpen] = useState(false)
  const settings = useLiveQuery(storage.getSettings)
  // An installed PWA resumes from memory, so refresh "now" when it comes back (week rollover).
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const wake = () => document.visibilityState === 'visible' && setNow(Date.now())
    document.addEventListener('visibilitychange', wake)
    return () => document.removeEventListener('visibilitychange', wake)
  }, [])

  const finished = useMemo(() => sessions?.filter((s) => s.finished) ?? [], [sessions])
  const draft = sessions?.find((s) => !s.finished)
  const tower = useMemo(
    () => (sessions && goals ? computeTower(finished.map((s) => s.date), goals, now) : null),
    [sessions, goals, finished, now],
  )
  const fx = useTowerFx(tower)

  if (!tower || !goals || !presets || !exercises) return null
  if (goals.length === 0) return <Navigate to="/welcome" replace />
  const exById = new Map(exercises.map((e) => [e.id, e]))
  const { height, shields, cracked, week } = tower
  const lastDone = (presetId: string) => finished.findLast((s) => s.presetId === presetId)?.date

  const start = async (presetId: string) => {
    if (draft && draft.presetId !== presetId && !(await ask('Discard your unfinished workout and start this one?', 'Discard'))) return
    haptics.tap()
    nav(`/workout/${await startSession(presetId)}`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-[18px] pb-1">
        <div className="flex items-center gap-2">
          <h1 className="tabular min-w-0 flex-1 text-[30px] leading-tight">
            {height > 0 ? (
              <>
                Week {height} <span className="text-muted">streak</span>
              </>
            ) : (
              'Build your tower'
            )}
          </h1>
          <div className="row flex h-11 items-center gap-1.5 px-3" aria-label={`${shields} shields`}>
            <ShieldCheck size={20} weight={shields ? 'fill' : 'regular'} className={shields ? 'text-people' : 'text-faint'} />
            <span className="tabular font-display font-black">{shields}</span>
          </div>
          <button aria-label="Profile and settings" onClick={() => nav('/profile')} className="press">
            <Avatar profile={settings?.profile} size={40} />
          </button>
        </div>
        <WeekCard week={week} />
        <div className="mt-2 flex min-h-5 flex-wrap gap-1.5">
          {cracked && <span className="chip bg-attention">Cracked · hit this week's goal to repair</span>}
          {week.done && <span className="chip bg-healthy">Week done</span>}
          {drive?.connected && drive.error && (
            <button onClick={() => nav('/settings')} className="chip bg-attention">
              Not synced
            </button>
          )}
        </div>
      </header>

      <TowerView tower={tower} fx={fx} />

      <div className="px-[18px] pt-3">
        <button
          onClick={() => {
            haptics.tap()
            setStartOpen(true)
          }}
          className="btn-primary chunky h-16 w-full text-lg"
        >
          {draft ? 'Resume workout' : 'Start workout'}
        </button>
      </div>

      <Sheet open={startOpen} onClose={() => setStartOpen(false)} title="Start workout">
        <div className="stagger min-h-0 space-y-2 overflow-y-auto pb-2">
          {draft && (
            <button onClick={() => nav(`/workout/${draft.id}`)} className="chunky w-full rounded-[18px] bg-attention [--lip:#d9be55] p-4 text-left text-on-pastel">
              <div className="font-display text-lg font-black">Resume {presets.find((p) => p.id === draft.presetId)?.name ?? 'workout'}</div>
              <div className="text-sm font-semibold opacity-80">
                {draft.entries.filter((e) => e.done).length} of {draft.entries.length} exercises done
              </div>
            </button>
          )}
          {presets.map((p) => {
            const t = lastDone(p.id)
            const names = p.exerciseIds.map((id) => exById.get(id)?.name).filter(Boolean)
            return (
              <div key={p.id} className="row flex items-stretch">
                <button onClick={() => start(p.id)} className="press min-w-0 flex-1 p-4 text-left">
                  <div className="truncate text-lg font-black">{p.name}</div>
                  <div className="mt-0.5 truncate text-[13px] font-semibold text-muted">{names.join(' · ') || 'No exercises yet'}</div>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {p.exerciseIds.slice(0, 6).map((id) => (
                      <ExTile key={id} id={id} ex={exById.get(id)} size={30} />
                    ))}
                    <span className="ml-auto pl-2 text-xs font-bold whitespace-nowrap text-muted">{t ? daysAgo(t) : 'never done'}</span>
                  </div>
                </button>
                <button aria-label={`Edit ${p.name}`} onClick={() => nav(`/presets/${p.id}`)} className="press grid w-12 shrink-0 place-items-center text-muted">
                  <PencilSimple size={20} />
                </button>
              </div>
            )
          })}
          <button
            onClick={async () => nav(`/presets/${(await createPreset()).id}?add=1`)}
            className={`press flex w-full items-center gap-3 rounded-[18px] p-4 text-left ${
              presets.length ? 'border-2 border-dashed border-white/15 text-muted' : 'chunky bg-attention [--lip:#d9be55] text-on-pastel'
            }`}
          >
            <Plus size={22} weight="bold" />
            <span>
              <span className="block font-display text-lg font-black">{presets.length ? 'New workout' : 'Create your first workout'}</span>
              <span className="block text-sm font-semibold opacity-80">Pick exercises from the library. Under a minute.</span>
            </span>
          </button>
        </div>
      </Sheet>

    </div>
  )
}

// ---------- Tower ----------

type Fx = { landed: boolean; cracked: boolean; repaired: boolean; collapsed: number; fillFrom: number | null }
type Seen = { height: number; shieldBlocks: number; past: number; cracked: boolean; weekStart: number; count: number }

const snap = (t: TowerState): Seen => ({
  height: t.height,
  shieldBlocks: t.blocks.filter((b) => b.kind === 'shield').length,
  past: t.pastTowers.length,
  cracked: t.cracked,
  weekStart: t.week.start,
  count: t.week.count,
})

/** Diffs the computed tower against what this device last showed, to pick which animations to play. */
function useTowerFx(t: TowerState | null): Fx | null {
  const [fx, setFx] = useState<Fx | null>(null)
  const key = t && JSON.stringify(snap(t))
  useEffect(() => {
    if (!t) return
    let off = false
    const now = snap(t)
    storage.getKv<Seen>('seen').then((prev) => {
      if (off) return
      storage.setKv('seen', now)
      if (!prev) return
      const collapsed = now.past > prev.past ? (t.pastTowers.at(-1)?.height ?? 0) : 0
      const f: Fx = {
        collapsed,
        landed: !collapsed && now.height > prev.height,
        cracked: !prev.cracked && now.cracked,
        repaired: !collapsed && prev.cracked && !now.cracked,
        fillFrom: now.weekStart === prev.weekStart && now.count > prev.count ? prev.count : null,
      }
      setFx(f)
      if (collapsed) {
        haptics.heavy()
        toast(`Tower collapsed at ${collapsed} weeks. Saved to past towers.`, 3500)
      } else if (now.shieldBlocks > prev.shieldBlocks) toast('Shield used')
      if (f.cracked) {
        haptics.heavy()
        toast('Missed a week. Your tower cracked.', 3000)
      }
      if (f.repaired) toast('Crack repaired')
    })
    return () => {
      off = true
    }
  }, [key])
  return fx
}

const LEVEL = 64 // block height; gap below each block is 18px

function TowerView({ tower, fx }: { tower: TowerState; fx: Fx | null }) {
  const ghostRef = useRef<HTMLDivElement>(null)
  const { blocks, height, best, week, cracked } = tower
  // Empty slots above the current week, up to the next milestone (or your best), so you see what's next.
  const here = height + 1
  const target = Math.min(here + 12, Math.max(best, nextMilestone(here), here + 3))
  const future = Array.from({ length: target - here }, (_, i) => target - i) // top → bottom
  const showBest = best > height

  useLayoutEffect(() => {
    ghostRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="relative min-h-0 flex-1">
      <div className="no-scrollbar h-full overflow-y-auto">
        <div className="flex min-h-full flex-col justify-end gap-[18px] px-[18px] pt-10">
          {future.map((n, i) => (
            <div key={n}>
              {showBest && n === best && <BestLine best={best} />}
              <FutureSlot n={n} fade={0.35 + (0.65 * (i + 1)) / future.length} />
            </div>
          ))}
          {showBest && best === here && <BestLine best={best} />}
          <Ghost ref={ghostRef} n={height + 1} week={week} fillFrom={fx?.fillFrom ?? null} done={week.done} />
          {blocks
            .map((b, i) => (
              <TowerBlock
                key={`${b.kind}-${b.weekStart}`}
                b={b}
                top={i === blocks.length - 1}
                cracked={cracked && i === blocks.length - 1}
                fx={fx}
              />
            ))
            .reverse()}
          <Ground start={blocks[0]?.weekStart} />
        </div>
      </div>
      <AnimatePresence>{fx?.collapsed ? <Collapse key="c" n={fx.collapsed} /> : null}</AnimatePresence>
    </div>
  )
}

function jitter(n: number) {
  return ((n * 37) % 9) - 4
}

function TowerBlock({ b, top, cracked, fx }: { b: Block; top: boolean; cracked: boolean; fx: Fx | null }) {
  if (b.kind === 'shield') {
    return (
      <div className={`slab slab-shield mx-auto flex h-7 w-[80%] items-center justify-center gap-1.5 text-xs ${cracked ? 'slab-cracked' : ''}`}>
        <ShieldCheck size={14} weight="fill" /> shield
      </div>
    )
  }
  const mat = materialFor(b.n)
  const land = top && fx?.landed
  return (
    <div className="relative" style={{ transform: `translateX(${jitter(b.n)}px)` }}>
      <motion.div
        initial={land ? { y: -420, opacity: 0, scaleY: 1 } : false}
        animate={land ? { y: [null, 0, 0, 0], opacity: 1, scaleY: [1, 1, 0.86, 1] } : { y: 0, opacity: 1 }}
        transition={land ? { duration: 0.7, times: [0, 0.55, 0.7, 1], ease: 'easeIn' } : undefined}
        onAnimationComplete={() => land && haptics.heavy()}
        className={`slab slab-${mat} mx-auto flex w-[88%] items-center justify-center font-display text-3xl font-black ${
          cracked ? 'slab-cracked' : ''
        } ${cracked && fx?.cracked ? 'shake' : ''}`}
        style={{ height: LEVEL, transformOrigin: 'bottom' }}
      >
        {b.n}
        {top && fx?.repaired && (
          <motion.div
            className="slab-cracked absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
          />
        )}
      </motion.div>
      {MILESTONES.has(b.n) && (
        <span className="chip absolute -top-2 right-[4%] flex items-center gap-1 bg-attention">
          <Flag size={11} weight="fill" /> {b.n} weeks
        </span>
      )}
    </div>
  )
}

/** Current week: one slab. Dashed outline where it's empty, solid material rising from the bottom. */
function Ghost({
  ref,
  n,
  week,
  fillFrom,
  done,
}: {
  ref: Ref<HTMLDivElement>
  n: number
  week: TowerState['week']
  fillFrom: number | null
  done: boolean
}) {
  const p = (c: number) => (done ? 0 : Math.min(100, (c / week.goal) * 100))
  const to = p(week.count)
  // Start at the last-seen fill, then transition to the real value on the next frame.
  const [shown, setShown] = useState(p(fillFrom ?? week.count))
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(to))
    return () => cancelAnimationFrame(id)
  }, [to])
  const t = 'clip-path .8s cubic-bezier(.2,.8,.2,1) .2s'
  return (
    <div ref={ref} className="relative mx-auto w-[88%]" style={{ height: LEVEL }}>
      <div
        className="absolute inset-0 rounded-2xl border-[2.5px] border-dashed border-faint"
        style={{ clipPath: `inset(0% 0% ${shown}% 0%)`, transition: t }}
      />
      <div
        className={`fill slab-${materialFor(n)} absolute inset-0 rounded-2xl`}
        style={{ clipPath: `inset(${100 - shown}% 0% 0% 0%)`, transition: t, backgroundImage: 'none' }}
      />
      {/* One sticker-style number, readable on both the empty and the filled part. */}
      <span
        className="absolute inset-0 grid place-items-center font-display text-3xl font-black text-text"
        style={{ WebkitTextStroke: '7px #0d0d0f', paintOrder: 'stroke fill' }}
      >
        {n}
      </span>
    </div>
  )
}

function FutureSlot({ n, fade }: { n: number; fade: number }) {
  const tier = TIER_START[n]
  return (
    <div
      className="relative mx-auto grid w-[88%] place-items-center rounded-2xl border-2 border-dashed border-white/10 font-display text-2xl font-black text-white/15"
      style={{ height: LEVEL, opacity: fade }}
    >
      {n}
      {MILESTONES.has(n) && (
        <span className="chip absolute -top-2 right-[4%] flex items-center gap-1 bg-attention">
          <Flag size={11} weight="fill" /> {n} weeks
        </span>
      )}
      {tier && (
        <span className={`chip fill slab-${tier} absolute -top-2 left-[4%]`} style={{ backgroundImage: 'none' }}>
          {tier[0].toUpperCase() + tier.slice(1)} unlocks
        </span>
      )}
    </div>
  )
}

function BestLine({ best }: { best: number }) {
  return (
    <div className="mb-[18px] flex items-center gap-2 text-xs font-extrabold text-muted">
      <span className="h-0 flex-1 border-t-2 border-dashed border-faint" />
      Best · {best} weeks
      <span className="h-0 flex-1 border-t-2 border-dashed border-faint" />
    </div>
  )
}

function WeekCard({ week }: { week: TowerState['week'] }) {
  const left = Math.max(0, week.goal - week.count)
  const today = (new Date().getDay() + 6) % 7
  return (
    <div className="row mt-3 p-4">
      <div className="mb-2.5 flex items-baseline justify-between">
        <span className="font-display text-lg font-black">This week</span>
        <span className="tabular text-sm font-bold text-muted">
          {week.count} of {week.goal} workouts
        </span>
      </div>
      <div className="bar">
        <div className="bg-healthy" style={{ width: `${Math.min(100, (week.count / week.goal) * 100)}%` }} />
      </div>
      <div className="mt-3 flex justify-between">
        {DAYS.map((d, i) => (
          <span
            key={i}
            className={`grid h-9 w-9 place-items-center rounded-full text-xs font-extrabold ${
              week.days[i] ? 'bg-healthy text-on-pastel' : 'bg-[#26262b] text-muted'
            } ${i === today ? 'ring-2 ring-text/70 ring-offset-2 ring-offset-surface' : ''}`}
          >
            {week.days[i] ? <Check size={16} weight="bold" /> : d}
          </span>
        ))}
      </div>
      <p className="mt-2.5 text-xs font-semibold text-muted">
        {left ? `${left} more to stack the next block` : 'Block stacked. Anything extra is a bonus.'}
      </p>
    </div>
  )
}

function Collapse({ n }: { n: number }) {
  const count = Math.min(n, 10)
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className={`slab slab-${materialFor(n - i)} absolute left-[6%] w-[88%]`}
          style={{ height: LEVEL, bottom: 24 + (count - 1 - i) * 82 }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: 900, x: (i % 2 ? 1 : -1) * (60 + i * 12), rotate: (i % 2 ? 1 : -1) * (20 + i * 6), opacity: 0.2 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, delay: i * 0.06, ease: [0.5, 0, 0.9, 0.5] }}
        />
      ))}
    </div>
  )
}

/** The ground the tower stands on: a grass strip over soil, with when this tower started. */
function Ground({ start }: { start?: number }) {
  return (
    <div className="-mx-[18px] -mt-1">
      <div className="mx-3 h-3.5 rounded-t-xl bg-[#8FBF88]" style={{ boxShadow: 'inset 0 3px 0 rgba(255,255,255,.28)' }} />
      <div
        className="grid h-14 place-items-center bg-[#26211d] text-xs font-extrabold text-[#9a8b7c]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 40%, #3a322b 0 3px, transparent 4px), radial-gradient(circle at 34% 75%, #3a322b 0 2px, transparent 3px), radial-gradient(circle at 70% 35%, #3a322b 0 3px, transparent 4px), radial-gradient(circle at 88% 70%, #3a322b 0 2px, transparent 3px)',
        }}
      >
        {start
          ? `Tower started ${new Date(start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Your tower starts here'}
      </div>
    </div>
  )
}
