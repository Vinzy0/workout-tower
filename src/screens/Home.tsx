import { CaretRight, Flag, List, ShieldCheck } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type Ref } from "react"
import { useNavigate } from 'react-router'
import { Sheet } from '../components/Sheet'
import { toast } from '../components/toast'
import { computeTower, materialFor, MILESTONES, type Block, type TowerState } from '../core/tower'
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
  const drive = useLiveQuery(getDriveState)
  const [startOpen, setStartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  if (!tower || !goals || !presets) return null
  const { height, shields, cracked, week } = tower
  const lastDone = (presetId: string) => finished.findLast((s) => s.presetId === presetId)?.date

  const start = async (presetId: string) => {
    if (draft && draft.presetId !== presetId && !confirm('Discard your unfinished workout and start this one?')) return
    haptics.tap()
    nav(`/workout/${await startSession(presetId)}`)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-[18px] pb-2">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="tabular text-[28px] leading-tight">{height > 0 ? `Week ${height} streak` : 'Build your tower'}</h1>
            <p className="tabular text-muted">
              {week.count} / {week.goal} this week
            </p>
          </div>
          <div className="row flex h-11 items-center gap-1.5 px-3" aria-label={`${shields} shields`}>
            <ShieldCheck size={20} weight={shields ? 'fill' : 'regular'} className={shields ? 'text-text' : 'text-faint'} />
            <span className="tabular font-[Rubik] font-medium">{shields}</span>
          </div>
          <button aria-label="Menu" onClick={() => setMenuOpen(true)} className="press row grid h-11 w-11 place-items-center">
            <List size={20} />
          </button>
        </div>
        <div className="mt-2 flex min-h-5 gap-1.5">
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

      <div className="safe-bottom px-[18px] pt-3">
        <button
          onClick={() => {
            haptics.tap()
            setStartOpen(true)
          }}
          className="btn-primary press h-16 w-full text-lg"
        >
          {draft ? 'Resume workout' : 'Start workout'}
        </button>
      </div>

      <Sheet open={startOpen} onClose={() => setStartOpen(false)} title="Start workout">
        <div className="min-h-0 space-y-1.5 overflow-y-auto pb-2">
          {draft && (
            <button onClick={() => nav(`/workout/${draft.id}`)} className="press w-full rounded-[18px] bg-attention p-4 text-left text-on-pastel">
              <div className="font-[Rubik] text-lg font-medium">Resume {presets.find((p) => p.id === draft.presetId)?.name ?? 'workout'}</div>
              <div className="text-sm opacity-80">
                {draft.entries.filter((e) => e.done).length} of {draft.entries.length} exercises done
              </div>
            </button>
          )}
          {presets.length === 0 ? (
            <button
              onClick={async () => nav(`/presets/${(await createPreset()).id}?add=1`)}
              className="press w-full rounded-[18px] bg-attention p-5 text-left text-on-pastel"
            >
              <div className="font-[Rubik] text-lg font-medium">Create your first workout</div>
              <div className="text-sm opacity-80">Pick exercises from the library. Under a minute.</div>
            </button>
          ) : (
            presets.map((p) => {
              const t = lastDone(p.id)
              return (
                <button key={p.id} onClick={() => start(p.id)} className="row press flex w-full items-center gap-3 px-4 py-4 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base">{p.name}</div>
                    <div className="text-xs text-muted">
                      {p.exerciseIds.length} exercises · {t ? `last done ${daysAgo(t)}` : 'never done'}
                    </div>
                  </div>
                  <CaretRight className="text-muted" />
                </button>
              )
            })
          )}
        </div>
        {presets.length > 0 && (
          <button onClick={() => nav('/presets')} className="h-12 text-sm text-muted underline underline-offset-[3px]">
            Edit workouts
          </button>
        )}
      </Sheet>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)}>
        <div className="space-y-1.5 pb-2">
          {[
            ['Workouts', '/presets'],
            ['Past towers', '/past'],
            ['Settings', '/settings'],
          ].map(([label, to]) => (
            <button key={to} onClick={() => nav(to)} className="row press flex w-full items-center px-4 py-4 text-left">
              <span className="flex-1">{label}</span>
              <CaretRight className="text-muted" />
            </button>
          ))}
        </div>
      </Sheet>

      <GoalPicker open={goals.length === 0} />
    </div>
  )
}

function GoalPicker({ open }: { open: boolean }) {
  return (
    <Sheet open={open} onClose={() => storage.setGoal(2)} title="How many workouts a week?">
      <p className="-mt-2 mb-4 text-sm text-muted">Hit it each week to stack a block. You can change it in settings.</p>
      <div className="grid grid-cols-7 gap-1.5 pb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            onClick={() => {
              haptics.tap()
              storage.setGoal(n)
            }}
            className={`press tabular h-16 rounded-xl font-[Rubik] text-xl font-medium ${n === 2 ? 'bg-text text-bg' : 'bg-surface'}`}
          >
            {n}
          </button>
        ))}
      </div>
    </Sheet>
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
  const spacers = Math.max(0, best - (height + 1))
  const showBest = best > height

  useLayoutEffect(() => {
    ghostRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="relative min-h-0 flex-1">
      <div className="no-scrollbar h-full overflow-y-auto">
        <div className="flex min-h-full flex-col justify-end gap-[18px] px-[18px] pb-6 pt-10">
          {showBest && (
            <div className="relative -mb-[9px] border-t-2 border-dashed border-faint">
              <span className="absolute -top-3 right-0 bg-bg pl-2 text-xs text-muted">Best · {best} weeks</span>
            </div>
          )}
          {Array.from({ length: spacers }, (_, i) => (
            <div key={i} style={{ height: LEVEL }} />
          ))}
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
          <div className="-mt-1 h-3 rounded-full bg-surface" />
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
        className={`slab slab-${mat} mx-auto flex w-[88%] items-center justify-center font-[Rubik] text-3xl font-bold ${
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
  const pct = (c: number) => `${done ? 0 : Math.min(100, (c / week.goal) * 100)}%`
  return (
    <div ref={ref} className="slab slab-ghost relative mx-auto w-[88%]" style={{ height: LEVEL }}>
      <motion.div
        className={`slab slab-${materialFor(n)} absolute inset-x-0 bottom-0 rounded-[14px] opacity-60`}
        style={{ boxShadow: 'none' }}
        initial={{ height: pct(fillFrom ?? week.count) }}
        animate={{ height: pct(week.count) }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.15 }}
      />
      <div className="relative flex h-full items-center gap-3 px-4">
        <span className="font-[Rubik] text-3xl font-bold text-muted">{n}</span>
        <div className="flex flex-1 justify-end gap-1">
          {DAYS.map((d, i) => {
            const on = !done && week.days[i]
            return (
              <span
                key={i}
                className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-medium ${
                  on ? 'bg-healthy text-on-pastel' : 'bg-surface text-muted'
                }`}
              >
                {d}
              </span>
            )
          })}
        </div>
      </div>
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
