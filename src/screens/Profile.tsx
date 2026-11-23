import { Camera, CaretRight, Plus } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Avatar } from '../components/Avatar'
import { ExTile } from '../components/ExerciseIcon'
import { TopBar } from '../components/ui'
import { liftHistory, performed } from '../core/stats'
import { computeTower } from '../core/tower'
import type { Profile as ProfileT } from '../core/types'
import { toDisplay } from '../core/units'
import { createPreset } from '../data'
import { pickPhoto, resize } from '../platform/camera'
import { storage } from '../platform/storage'
import { SettingsSections } from './Settings'

const compact = (n: number) => (n >= 10000 ? `${Math.round(n / 100) / 10}k` : String(Math.round(n)))

/** You: photo, name, bio, lifetime stats, your workouts, and every setting. One tap from the Tower. */
export function Profile() {
  const nav = useNavigate()
  const settings = useLiveQuery(storage.getSettings)
  const sessions = useLiveQuery(storage.listSessions)
  const goals = useLiveQuery(storage.listGoals)
  const presets = useLiveQuery(storage.listPresets)
  const exercises = useLiveQuery(storage.listExercises)
  const [draft, setDraft] = useState<ProfileT | null>(null)

  const done = useMemo(() => (sessions ?? []).filter((s) => s.finished), [sessions])
  if (!settings || !sessions || !goals || !presets || !exercises) return null
  const profile = draft ?? settings.profile ?? {}
  const save = (p: ProfileT) => {
    setDraft(p)
    storage.putSettings({ ...settings, profile: p })
  }

  const tower = computeTower(done.map((s) => s.date), goals, Date.now())
  const moved = done.reduce((v, s) => v + performed(s).reduce((a, e) => a + e.sets.reduce((b, x) => b + x.weight * x.reps, 0), 0), 0)
  const now = new Date()
  const thisMonth = done.filter((s) => new Date(s.date).getMonth() === now.getMonth() && new Date(s.date).getFullYear() === now.getFullYear()).length
  const lifts = [...liftHistory(done).entries()].sort((a, b) => b[1].length - a[1].length)
  const exById = new Map(exercises.map((e) => [e.id, e]))
  const top = lifts[0] ? exById.get(lifts[0][0])?.name : undefined

  const changePhoto = async () => {
    const raw = await pickPhoto('library')
    if (raw) save({ ...profile, avatar: await resize(raw, 256, true) })
  }

  const stats: [string, string][] = [
    [String(done.length), 'workouts'],
    [String(tower.height), 'week streak'],
    [String(tower.best), 'best tower'],
    [compact(toDisplay(moved, settings.unit)), `${settings.unit} moved`],
    [String(thisMonth), 'this month'],
    [top ?? '—', 'top lift'],
  ]

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Profile" />
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-[18px] pb-10">
        <section className="flex flex-col items-center text-center">
          <button onClick={changePhoto} className="press relative" aria-label="Change profile photo">
            <Avatar profile={profile} size={96} />
            <span className="absolute -right-1 -bottom-1 grid h-9 w-9 place-items-center rounded-full bg-text text-bg" style={{ border: '3px solid #0d0d0f' }}>
              <Camera size={16} weight="bold" />
            </span>
          </button>
          <input
            value={profile.name ?? ''}
            onChange={(e) => save({ ...profile, name: e.target.value })}
            placeholder="Your name"
            aria-label="Name"
            className="mt-4 w-full bg-transparent text-center font-display text-[28px] font-black outline-none placeholder:text-faint"
          />
          <textarea
            value={profile.bio ?? ''}
            onChange={(e) => save({ ...profile, bio: e.target.value.slice(0, 120) })}
            placeholder="A short line about you, e.g. home gym, 3x a week, chasing a 20 kg press"
            aria-label="Short description"
            rows={2}
            className="mt-1 w-full resize-none rounded-2xl bg-transparent px-2 text-center font-semibold text-muted outline-none placeholder:text-faint focus:bg-surface"
          />
        </section>

        <section className="grid grid-cols-3 gap-2">
          {stats.map(([v, l]) => (
            <div key={l} className="row px-2 py-3 text-center">
              <div className={`tabular truncate font-display font-black ${v.length > 6 ? "pt-1 text-sm" : "text-xl"}`}>{v}</div>
              <div className="text-[11px] font-bold text-muted">{l}</div>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-2 text-lg">Your workouts</h2>
          <div className="space-y-1.5">
            {presets.map((p) => (
              <button key={p.id} onClick={() => nav(`/presets/${p.id}`)} className="row press flex w-full items-center gap-3 p-3 text-left">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold">{p.name}</div>
                  <div className="mt-1.5 flex gap-1">
                    {p.exerciseIds.slice(0, 7).map((id) => (
                      <ExTile key={id} id={id} ex={exById.get(id)} size={24} />
                    ))}
                    {p.exerciseIds.length === 0 && <span className="text-xs font-semibold text-muted">No exercises yet</span>}
                  </div>
                </div>
                <CaretRight className="text-muted" />
              </button>
            ))}
            <button
              onClick={async () => nav(`/presets/${(await createPreset()).id}?add=1`)}
              className="press flex w-full items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 p-3 font-extrabold text-muted"
            >
              <Plus size={18} weight="bold" /> New workout
            </button>
          </div>
        </section>

        <button onClick={() => nav('/past')} className="row press flex w-full items-center p-4 text-left">
          <span className="flex-1 font-extrabold">Past towers</span>
          <span className="mr-2 text-sm font-bold text-muted">{tower.pastTowers.length}</span>
          <CaretRight className="text-muted" />
        </button>

        <section>
          <h2 className="mb-3 text-lg">Settings</h2>
          <SettingsSections />
        </section>
      </div>
    </div>
  )
}
