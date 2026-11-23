// Every record carries updatedAt so sync/import can merge by id (newest wins).
// Deletes are soft (`deleted: true`) so a delete also survives a merge.

export type SetEntry = { weight: number; reps: number } // weight in kg (per dumbbell / added BW)

export type Entry = { exerciseId: string; sets: SetEntry[]; done: boolean }

// dumbbell: weight per dumbbell ("kg each"). cable/barbell: total load ("kg").
// bodyweight: weight is added load ("BW" at 0, "+X" above).
export type Equipment = 'dumbbell' | 'cable' | 'barbell' | 'bodyweight'
export const EQUIPMENT: Equipment[] = ['dumbbell', 'cable', 'barbell', 'bodyweight']

export type Exercise = {
  id: string
  name: string
  emoji: string
  stepSize: number
  bodyweight: boolean // kept in sync with equipment === 'bodyweight'
  /** Missing on older records: derive with equipmentOf(). */
  equipment?: Equipment
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
  startedAt?: number // set when finished
  finished: boolean
  entries: Entry[]
  updatedAt: number
  deleted?: boolean
}

export type GoalChange = { id: string; goal: number; at: number; updatedAt: number }

export type Unit = 'kg' | 'lb'

export type Profile = { name?: string; bio?: string; avatar?: string } // avatar: small JPEG data URL

export type Picker = 'bottom' | 'side' // where the workout screen's exercise list sits

export type Settings = { id: 'settings'; unit: Unit; sound?: boolean; picker?: Picker; profile?: Profile; updatedAt: number }

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
