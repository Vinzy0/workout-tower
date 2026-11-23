import { describe, expect, it } from 'vitest'
import { liftHistory } from './stats'
import type { Session } from './types'

const session = (date: number, entries: Session['entries'], finished = true): Session => ({
  id: String(date),
  presetId: 'p',
  date,
  finished,
  entries,
  updatedAt: date,
})

describe('liftHistory', () => {
  it('builds one point per finished session, oldest first, from done exercises', () => {
    const sets = [
      { weight: 40, reps: 10 },
      { weight: 42.5, reps: 8 },
    ]
    const h = liftHistory([
      session(3, [{ exerciseId: 'row', sets: [{ weight: 45, reps: 6 }], done: true }]),
      session(1, [
        { exerciseId: 'row', sets, done: true },
        { exerciseId: 'curl', sets: [{ weight: 10, reps: 10 }], done: false }, // skipped: not done
      ]),
      session(2, [{ exerciseId: 'row', sets: [{ weight: 99, reps: 1 }], done: true }], false), // draft
    ])
    expect(h.get('row')?.map((p) => p.date)).toEqual([1, 3])
    expect(h.get('row')?.[0]).toMatchObject({ top: 42.5, volume: 740, bestReps: 10 })
    expect(h.has('curl')).toBe(false)
  })

  it('counts every exercise when nothing was marked done', () => {
    const h = liftHistory([session(1, [{ exerciseId: 'curl', sets: [{ weight: 10, reps: 10 }], done: false }])])
    expect(h.get('curl')).toHaveLength(1)
  })
})
