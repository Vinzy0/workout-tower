// App actions on top of the storage interface. No platform APIs here.
import { LIBRARY } from './core/library'
import type { Entry, Exercise, Preset, Session, SetEntry } from './core/types'
import { newId, storage } from './platform/storage'

export async function createPreset(): Promise<Preset> {
  const taken = new Set((await storage.listPresets()).map((p) => p.name))
  const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((l) => !taken.has(`Workout ${l}`)) ?? 'Z'
  const p: Preset = { id: newId(), name: `Workout ${letter}`, exerciseIds: [], updatedAt: Date.now() }
  await storage.putPreset(p)
  return p
}

/** Adds library or existing exercises to a preset, creating library records on first use. */
export async function addToPreset(presetId: string, ids: string[]) {
  const preset = await storage.getPreset(presetId)
  if (!preset) return
  for (const id of ids) {
    const existing = await storage.getExercise(id)
    if (!existing || existing.deleted) {
      const lib = LIBRARY.find((l) => l.id === id)
      if (lib) {
        const { group: _group, ...ex } = lib
        await storage.putExercise({ ...ex, updatedAt: Date.now() })
      }
    }
  }
  const exerciseIds = [...preset.exerciseIds, ...ids.filter((id) => !preset.exerciseIds.includes(id))]
  await storage.putPreset({ ...preset, exerciseIds })
}

export async function createCustomExercise(e: Pick<Exercise, 'name' | 'emoji' | 'stepSize' | 'bodyweight'>): Promise<string> {
  const id = newId()
  await storage.putExercise({ ...e, id, defaultWeight: 0, defaultReps: 10, defaultSets: 3, updatedAt: Date.now() })
  return id
}

/** Most recent finished sets for an exercise, or undefined. */
function lastSets(sessions: Session[], exerciseId: string): SetEntry[] | undefined {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i]
    if (!s.finished) continue
    const e = s.entries.find((x) => x.exerciseId === exerciseId)
    if (e && e.sets.length) return e.sets
  }
}

export function nextSet(sessions: Session[], ex: Exercise, entry: Entry): SetEntry {
  const last = lastSets(sessions, ex.id)
  const i = entry.sets.length
  return last?.[i] ?? entry.sets.at(-1) ?? { weight: ex.defaultWeight, reps: ex.defaultReps }
}

/** Starts a session from a preset. Wheels start at last session's values, else preset defaults. */
export async function startSession(presetId: string): Promise<string> {
  const draft = await storage.getDraft()
  if (draft) {
    if (draft.presetId === presetId) return draft.id
    await storage.deleteSession(draft.id)
  }
  const preset = await storage.getPreset(presetId)
  const sessions = await storage.listSessions()
  const entries: Entry[] = []
  for (const id of preset?.exerciseIds ?? []) {
    const ex = await storage.getExercise(id)
    if (!ex) continue
    const last = lastSets(sessions, id)
    const count = last?.length ?? ex.defaultSets
    const sets = Array.from({ length: count }, (_, i) => last?.[i] ?? { weight: ex.defaultWeight, reps: ex.defaultReps })
    entries.push({ exerciseId: id, sets, done: false })
  }
  const s: Session = { id: newId(), presetId, date: Date.now(), finished: false, entries, updatedAt: Date.now() }
  await storage.putSession(s)
  return s.id
}

export function daysAgo(t: number, now = Date.now()): string {
  const a = new Date(t)
  const b = new Date(now)
  const days = Math.round(
    (new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime() - new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime()) / 86400000,
  )
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
