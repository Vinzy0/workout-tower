import { describe, expect, it } from 'vitest'
import { computeTower, weekStart } from './tower'
import type { GoalChange } from './types'

// 2026-01-05 is a Monday. wk(n, day) = a timestamp in week n (0-based), day 0 = Monday.
const MON = new Date(2026, 0, 5).getTime()
const wk = (n: number, day = 0, hour = 18) => new Date(2026, 0, 5 + n * 7 + day, hour).getTime()
const goal = (g: number, at: number): GoalChange => ({ id: `g${at}`, goal: g, at, updatedAt: at })
const G2 = [goal(2, MON)]

/** Two workouts in each listed week. */
const hits = (...weeks: number[]) => weeks.flatMap((n) => [wk(n, 0), wk(n, 2)])

describe('computeTower', () => {
  it('weeks start on Monday local time', () => {
    expect(weekStart(wk(3, 6, 23))).toBe(new Date(2026, 0, 26).getTime())
  })

  it('builds a block per goal-hit week and tracks the current week', () => {
    const s = computeTower([...hits(0, 1), wk(2, 1)], G2, wk(2, 3))
    expect(s.height).toBe(2)
    expect(s.blocks.map((b) => b.kind)).toEqual(['week', 'week'])
    expect(s.week).toMatchObject({ count: 1, goal: 2, done: false })
    expect(s.week.days).toEqual([false, true, false, false, false, false, false])
  })

  it('solidifies the current week as soon as the goal is hit', () => {
    const s = computeTower(hits(0, 1, 2), G2, wk(2, 4))
    expect(s.height).toBe(3)
    expect(s.week.done).toBe(true)
  })

  it('earns a shield every 4 weeks (max 2) and auto-uses it on a miss', () => {
    const twelve = hits(...Array.from({ length: 12 }, (_, i) => i))
    const full = computeTower(twelve, G2, wk(12, 0))
    expect(full.shields).toBe(2) // 3 earned, capped at 2

    // weeks 0-3 hit, week 4 missed → shield slab, tower survives, not cracked
    const s = computeTower(hits(0, 1, 2, 3), G2, wk(5, 0))
    expect(s.shields).toBe(0)
    expect(s.cracked).toBe(false)
    expect(s.height).toBe(4)
    expect(s.blocks.at(-1)?.kind).toBe('shield')
  })

  it('cracks on a miss without a shield, then repairs on the next hit', () => {
    const cracked = computeTower(hits(0, 1), G2, wk(3, 0))
    expect(cracked.cracked).toBe(true)
    expect(cracked.height).toBe(2) // frozen, not reset

    const repaired = computeTower([...hits(0, 1), ...hits(3)], G2, wk(4, 0))
    expect(repaired.cracked).toBe(false)
    expect(repaired.height).toBe(3)
  })

  it('collapses on a second miss while cracked and starts a new tower', () => {
    const s = computeTower([...hits(0, 1, 2), ...hits(5)], G2, wk(6, 0))
    expect(s.pastTowers).toEqual([{ height: 3, start: wk(0, 0, 0), end: wk(4, 0, 0) }])
    expect(s.height).toBe(1)
    expect(s.best).toBe(3)
  })

  it('handles many missed weeks in a row (shield, crack, collapse, then idle)', () => {
    // 4 hits → 1 shield. Then 10 empty weeks: shield, crack, collapse, then nothing left to damage.
    const s = computeTower(hits(0, 1, 2, 3), G2, wk(14, 0))
    expect(s.pastTowers).toHaveLength(1)
    expect(s.pastTowers[0].height).toBe(4)
    expect(s.blocks).toEqual([])
    expect(s.height).toBe(0)
    expect(s.cracked).toBe(false)
  })

  it('judges each week with the goal set at that time', () => {
    // Goal 2 for weeks 0-1, raised to 3 during week 2, so two workouts in week 2 is a miss.
    const goals = [goal(2, MON), goal(3, wk(2, 1))]
    const s = computeTower(hits(0, 1, 2), goals, wk(3, 0))
    expect(s.height).toBe(2)
    expect(s.cracked).toBe(true)
    expect(s.week.goal).toBe(3)

    // Lowering the goal later does not rewrite those old weeks.
    const later = computeTower(hits(0, 1, 2), [...goals, goal(1, wk(3, 1))], wk(3, 2))
    expect(later.height).toBe(2)
    expect(later.cracked).toBe(true)
  })

  it('never counts the in-progress week as a miss', () => {
    const s = computeTower(hits(0), G2, wk(1, 6, 22))
    expect(s.cracked).toBe(false)
    expect(s.week).toMatchObject({ count: 0, done: false })
  })
})
