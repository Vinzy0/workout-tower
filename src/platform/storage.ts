// Web storage: IndexedDB via Dexie. Local data is always the source of truth.
// Capacitor keeps working with this (IndexedDB exists in the WebView); see NATIVE_MIGRATION.md.
import Dexie, { type Table } from 'dexie'
import { mergeDumps } from '../core/merge'
import type { DataDump, Exercise, GoalChange, Preset, Session, Settings } from '../core/types'

type Kv = { id: string; value: unknown }
type Photo = { id: string; data: string } // id = session id, data = JPEG data URL

class Db extends Dexie {
  exercises!: Table<Exercise, string>
  presets!: Table<Preset, string>
  sessions!: Table<Session, string>
  goals!: Table<GoalChange, string>
  settings!: Table<Settings, string>
  kv!: Table<Kv, string> // device-local state that is never synced (sync status, last-seen tower)
  photos!: Table<Photo, string> // workout photos, device-only (too big for the Drive JSON)
  thumbs!: Table<Photo, string> // small square versions for the calendar

  constructor() {
    super('workout-tower')
    this.version(1).stores({
      exercises: 'id',
      presets: 'id',
      sessions: 'id, date',
      goals: 'id, at',
      settings: 'id',
      kv: 'id',
    })
    this.version(2).stores({ photos: 'id', thumbs: 'id' })
  }
}

const db = new Db()
const now = () => Date.now()
const alive = <T extends { deleted?: boolean }>(xs: T[]) => xs.filter((x) => !x.deleted)

export const newId = () => crypto.randomUUID()

export const storage = {
  // Exercises
  listExercises: async () => alive(await db.exercises.toArray()),
  getExercise: (id: string) => db.exercises.get(id),
  putExercise: (e: Exercise) => db.exercises.put({ ...e, updatedAt: now() }),

  // Presets
  listPresets: async () => alive(await db.presets.toArray()).sort((a, b) => a.name.localeCompare(b.name)),
  getPreset: (id: string) => db.presets.get(id),
  putPreset: (p: Preset) => db.presets.put({ ...p, updatedAt: now() }),
  deletePreset: (id: string) => db.presets.update(id, { deleted: true, updatedAt: now() }),

  // Sessions
  listSessions: async () => alive(await db.sessions.orderBy('date').toArray()),
  getSession: (id: string) => db.sessions.get(id),
  putSession: (s: Session) => db.sessions.put({ ...s, updatedAt: now() }),
  deleteSession: async (id: string) => {
    await db.sessions.update(id, { deleted: true, updatedAt: now() })
    await db.photos.delete(id)
    await db.thumbs.delete(id)
  },
  getDraft: async () => alive(await db.sessions.toArray()).find((s) => !s.finished),

  // Workout photos (one per session)
  getPhoto: async (id: string) => (await db.photos.get(id))?.data,
  listThumbs: async () => new Map((await db.thumbs.toArray()).map((t) => [t.id, t.data])),
  putPhoto: (id: string, full: string, thumb: string) =>
    db.transaction('rw', db.photos, db.thumbs, async () => {
      await db.photos.put({ id, data: full })
      await db.thumbs.put({ id, data: thumb })
    }),
  deletePhoto: (id: string) => Promise.all([db.photos.delete(id), db.thumbs.delete(id)]),
  listPhotos: () => db.photos.toArray(),
  hasPhoto: async (id: string) => !!(await db.thumbs.get(id)),

  /** Deletes the whole local database (workouts, photos, profile, everything). */
  wipeAll: async () => {
    db.close()
    await Dexie.delete('workout-tower')
  },

  // Weekly goal history
  listGoals: () => db.goals.orderBy('at').toArray(),
  setGoal: (goal: number) => db.goals.put({ id: newId(), goal, at: now(), updatedAt: now() }),

  // Settings
  getSettings: async (): Promise<Settings> =>
    (await db.settings.get('settings')) ?? { id: 'settings', unit: 'kg', updatedAt: 0 },
  putSettings: (s: Settings) => db.settings.put({ ...s, updatedAt: now() }),

  // Device-local key/value
  getKv: async <T>(id: string): Promise<T | undefined> => (await db.kv.get(id))?.value as T | undefined,
  setKv: (id: string, value: unknown) => db.kv.put({ id, value }),

  // Full export / import (manual backup + Drive file)
  async exportAll(): Promise<DataDump> {
    const [exercises, presets, sessions, goals, settings] = await Promise.all([
      db.exercises.toArray(),
      db.presets.toArray(),
      db.sessions.toArray(),
      db.goals.toArray(),
      db.settings.get('settings'),
    ])
    const all = [...exercises, ...presets, ...sessions, ...goals, ...(settings ? [settings] : [])]
    const updatedAt = Math.max(0, ...all.map((r) => r.updatedAt))
    return { app: 'workout-tower', version: 1, updatedAt, exercises, presets, sessions, goals, settings: settings ?? null }
  },

  /** Merges `incoming` into local data by id + updatedAt. Nothing local is lost. */
  async importMerge(incoming: DataDump) {
    const merged = mergeDumps(await storage.exportAll(), incoming)
    await db.transaction('rw', [db.exercises, db.presets, db.sessions, db.goals, db.settings], async () => {
      await db.exercises.bulkPut(merged.exercises)
      await db.presets.bulkPut(merged.presets)
      await db.sessions.bulkPut(merged.sessions)
      await db.goals.bulkPut(merged.goals)
      if (merged.settings) await db.settings.put(merged.settings)
    })
  },
}
