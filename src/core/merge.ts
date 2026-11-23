import type { DataDump } from './types'

type Rec = { id: string; updatedAt: number }

/** Union by id; when both sides have a record, the newer updatedAt wins. */
export function mergeById<T extends Rec>(a: T[], b: T[]): T[] {
  const out = new Map<string, T>()
  for (const r of [...a, ...b]) {
    const prev = out.get(r.id)
    if (!prev || r.updatedAt > prev.updatedAt) out.set(r.id, r)
  }
  return [...out.values()]
}

export function mergeDumps(local: DataDump, remote: DataDump): DataDump {
  const settings =
    !local.settings || (remote.settings && remote.settings.updatedAt > local.settings.updatedAt)
      ? remote.settings
      : local.settings
  return {
    app: 'workout-tower',
    version: 1,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
    exercises: mergeById(local.exercises, remote.exercises),
    presets: mergeById(local.presets, remote.presets),
    sessions: mergeById(local.sessions, remote.sessions),
    goals: mergeById(local.goals, remote.goals),
    settings,
  }
}

export function isDump(x: unknown): x is DataDump {
  const d = x as DataDump
  return !!d && d.app === 'workout-tower' && Array.isArray(d.sessions) && Array.isArray(d.presets)
}
