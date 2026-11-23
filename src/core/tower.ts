import { DEFAULT_GOAL, type GoalChange } from './types'

// Weeks run Monday 00:00 to Sunday 23:59, device local time (Asia/Manila for Vince).
export function weekStart(t: number): number {
  const d = new Date(t)
  const back = (d.getDay() + 6) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - back).getTime()
}

export function addWeeks(ws: number, n: number): number {
  const d = new Date(ws)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n).getTime()
}

/** Goal in effect at time t: the latest change at or before t (earliest change if t predates all). */
export function goalAt(goals: GoalChange[], t: number): number {
  if (goals.length === 0) return DEFAULT_GOAL
  const sorted = [...goals].sort((a, b) => a.at - b.at)
  let g = sorted[0].goal
  for (const c of sorted) if (c.at <= t) g = c.goal
  return g
}

export type Block = { kind: 'week'; n: number; weekStart: number } | { kind: 'shield'; weekStart: number }

export type PastTower = { height: number; start: number; end: number }

export type TowerState = {
  blocks: Block[] // bottom → top, finished weeks only (incl. the current week once its goal is hit)
  height: number // goal-hit weeks in this tower = the streak
  shields: number
  cracked: boolean
  pastTowers: PastTower[] // oldest first
  best: number
  week: { start: number; count: number; goal: number; days: boolean[]; done: boolean }
}

export const MAX_SHIELDS = 2

/**
 * Derives the whole tower from finished session dates. Never stored.
 * A week's goal is the goal in effect when that week ended (or "now" for the current week).
 * The current week can only ever succeed: it is never judged a miss until it is over.
 */
export function computeTower(sessionDates: number[], goals: GoalChange[], now: number): TowerState {
  const cur = weekStart(now)
  const counts = new Map<number, number>()
  const days = Array<boolean>(7).fill(false)
  for (const t of sessionDates) {
    if (t > now) continue
    const ws = weekStart(t)
    counts.set(ws, (counts.get(ws) ?? 0) + 1)
    if (ws === cur) days[(new Date(t).getDay() + 6) % 7] = true
  }

  let blocks: Block[] = []
  let height = 0
  let shields = 0
  let cracked = false
  const pastTowers: PastTower[] = []

  const apply = (hit: boolean, ws: number) => {
    if (hit) {
      cracked = false
      height++
      blocks.push({ kind: 'week', n: height, weekStart: ws })
      if (height % 4 === 0) shields = Math.min(MAX_SHIELDS, shields + 1)
    } else if (blocks.length === 0) {
      // Nothing built yet: a miss has nothing to damage.
    } else if (shields > 0) {
      shields--
      blocks.push({ kind: 'shield', weekStart: ws })
    } else if (!cracked) {
      cracked = true
    } else {
      pastTowers.push({ height, start: blocks[0].weekStart, end: ws })
      blocks = []
      height = 0
      shields = 0
      cracked = false
    }
  }

  if (counts.size > 0) {
    for (let ws = Math.min(...counts.keys()); ws < cur; ws = addWeeks(ws, 1)) {
      const goal = goalAt(goals, Math.min(addWeeks(ws, 1) - 1, now))
      apply((counts.get(ws) ?? 0) >= goal, ws)
    }
  }

  const count = counts.get(cur) ?? 0
  const goal = goalAt(goals, now)
  const done = count >= goal
  if (done) apply(true, cur)

  const best = Math.max(height, ...pastTowers.map((p) => p.height))
  return { blocks, height, shields, cracked, pastTowers, best, week: { start: cur, count, goal, days, done } }
}

export type Material = 'wood' | 'stone' | 'iron' | 'gold' | 'diamond'

export function materialFor(n: number): Material {
  if (n <= 4) return 'wood'
  if (n <= 8) return 'stone'
  if (n <= 12) return 'iron'
  if (n <= 20) return 'gold'
  return 'diamond'
}

export const MILESTONES = new Set([4, 8, 12, 20, 52])
