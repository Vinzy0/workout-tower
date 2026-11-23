import type { Entry, Session, SetEntry } from './types'

/**
 * What was actually done in a session: the exercises marked done.
 * If nothing was marked done (some people never tap Done), every exercise with sets counts.
 */
export function performed(s: Session): Entry[] {
  const withSets = s.entries.filter((e) => e.sets.length > 0)
  const done = withSets.filter((e) => e.done)
  return done.length ? done : withSets
}

export type LiftPoint = {
  date: number
  sets: SetEntry[]
  top: number // heaviest set (kg)
  volume: number // sum of weight × reps (kg)
  bestReps: number
}

/** Per exercise, one point per finished session, oldest first. */
export function liftHistory(sessions: Session[]): Map<string, LiftPoint[]> {
  const out = new Map<string, LiftPoint[]>()
  const finished = sessions.filter((s) => s.finished && !s.deleted).sort((a, b) => a.date - b.date)
  for (const s of finished) {
    for (const e of performed(s)) {
      const point: LiftPoint = {
        date: s.date,
        sets: e.sets,
        top: Math.max(...e.sets.map((x) => x.weight)),
        volume: e.sets.reduce((sum, x) => sum + x.weight * x.reps, 0),
        bestReps: Math.max(...e.sets.map((x) => x.reps)),
      }
      out.set(e.exerciseId, [...(out.get(e.exerciseId) ?? []), point])
    }
  }
  return out
}
