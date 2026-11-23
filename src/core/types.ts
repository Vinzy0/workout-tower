// Every record carries updatedAt so sync/import can merge by id (newest wins).
// Deletes are soft (`deleted: true`) so a delete also survives a merge.

export type SetEntry = { weight: number; reps: number } // weight in kg (per dumbbell / added BW)

export type Entry = { exerciseId: string; sets: SetEntry[]; done: boolean }

export type Exercise = {
  id: string
  name: string
  emoji: string
  stepSize: number
  bodyweight: boolean
  defaultWeight: number
  defaultReps: number
  defaultSets: number
  updatedAt: number
  deleted?: boolean
}

export type Preset = {
  id: string
  name: string
  exerciseIds: string[]
  updatedAt: number
  deleted?: boolean
}

export type Session = {
  id: string
  presetId: string
  date: number // started at, then finished at (ms)
  finished: boolean
  entries: Entry[]
  updatedAt: number
  deleted?: boolean
}

export type GoalChange = { id: string; goal: number; at: number; updatedAt: number }

export type Unit = 'kg' | 'lb'

export type Settings = { id: 'settings'; unit: Unit; updatedAt: number }

export type DataDump = {
  app: 'workout-tower'
  version: 1
  updatedAt: number
  exercises: Exercise[]
  presets: Preset[]
  sessions: Session[]
  goals: GoalChange[]
  settings: Settings | null
}

export const STEP_SIZES = [0.5, 1, 1.25, 2, 2.5, 5] as const
export const DEFAULT_GOAL = 2
