import type { Equipment, Exercise } from './types'

// Built-in exercise library. Weights in kg: per dumbbell, total for cable/barbell, added load for bodyweight.
// Library ids are stable ("lib-<slug>") so the same exercise shares history across presets.
type Item = [name: string, emoji: string, group: string, defaultWeight: number, defaultReps: number, equipment?: Equipment] // default dumbbell

const ITEMS: Item[] = [
  // Shoulders
  ['DB shoulder press', '🏋️', 'Shoulders', 10, 10],
  ['Arnold press', '🌀', 'Shoulders', 7.5, 10],
  ['Lateral raise', '🪽', 'Shoulders', 5, 12],
  ['Front raise', '🙌', 'Shoulders', 5, 12],
  ['Rear delt fly', '🦅', 'Shoulders', 5, 12],
  ['Upright row', '🪜', 'Shoulders', 7.5, 12],
  ['Shrugs', '🤷', 'Shoulders', 15, 12],
  ['Cable lateral raise', '🎐', 'Shoulders', 5, 12, 'cable'],
  ['Face pull', '🪢', 'Shoulders', 15, 15, 'cable'],
  // Chest
  ['DB bench press', '🛋️', 'Chest', 12.5, 10],
  ['Incline DB press', '📐', 'Chest', 10, 10],
  ['DB floor press', '🛏️', 'Chest', 12.5, 10],
  ['DB fly', '🦋', 'Chest', 7.5, 12],
  ['Push-up', '🫸', 'Chest', 0, 12, 'bodyweight'],
  ['Diamond push-up', '💎', 'Chest', 0, 10, 'bodyweight'],
  ['Pike push-up', '🔺', 'Chest', 0, 8, 'bodyweight'],
  // Back
  ['One-arm DB row', '🚣', 'Back', 15, 10],
  ['Renegade row', '🛶', 'Back', 7.5, 8],
  ['DB pullover', '🌈', 'Back', 10, 12],
  ['Pull-up', '🧗', 'Back', 0, 6, 'bodyweight'],
  ['Chin-up', '🪝', 'Back', 0, 6, 'bodyweight'],
  ['Inverted row', '🔄', 'Back', 0, 10, 'bodyweight'],
  ['Superman', '🦸', 'Back', 0, 12, 'bodyweight'],
  ['Lat pulldown', '⏬', 'Back', 30, 10, 'cable'],
  ['Seated cable row', '🚤', 'Back', 30, 10, 'cable'],
  // Arms
  ['DB curl', '💪', 'Arms', 10, 10],
  ['Hammer curl', '🔨', 'Arms', 10, 10],
  ['Concentration curl', '🎯', 'Arms', 7.5, 10],
  ['Overhead triceps extension', '🙆', 'Arms', 10, 12],
  ['Triceps kickback', '🐎', 'Arms', 5, 12],
  ['DB skull crusher', '💀', 'Arms', 7.5, 10],
  ['Dips', '⬇️', 'Arms', 0, 8, 'bodyweight'],
  ['Cable triceps pushdown', '👇', 'Arms', 20, 12, 'cable'],
  ['Cable overhead triceps extension', '🔼', 'Arms', 15, 12, 'cable'],
  ['Cable curl', '🧵', 'Arms', 15, 12, 'cable'],
  ['Preacher curl (EZ bar)', '🙏', 'Arms', 20, 10, 'barbell'],
  // Legs
  ['Goblet squat', '🏆', 'Legs', 15, 10],
  ['DB lunge', '🚶', 'Legs', 10, 10],
  ['Bulgarian split squat', '🦩', 'Legs', 7.5, 8],
  ['DB Romanian deadlift', '🪵', 'Legs', 15, 10],
  ['DB step-up', '📦', 'Legs', 7.5, 10],
  ['DB calf raise', '🦶', 'Legs', 15, 15],
  ['Glute bridge', '🍑', 'Legs', 0, 15, 'bodyweight'],
  ['Bodyweight squat', '🦵', 'Legs', 0, 15, 'bodyweight'],
  ['Jump squat', '🦘', 'Legs', 0, 12, 'bodyweight'],
  // Core
  ['Plank (reps = seconds)', '🧱', 'Core', 0, 30, 'bodyweight'],
  ['Crunch', '🔥', 'Core', 0, 15, 'bodyweight'],
  ['Russian twist', '🌪️', 'Core', 5, 20],
  ['Hanging leg raise', '🦿', 'Core', 0, 10, 'bodyweight'],
  ['Mountain climber', '🏔️', 'Core', 0, 20, 'bodyweight'],
  ['Bicycle crunch', '🚲', 'Core', 0, 20, 'bodyweight'],
  ['DB side bend', '🎋', 'Core', 10, 12],
]

export type LibraryExercise = Omit<Exercise, 'updatedAt'> & { group: string }

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const LIBRARY: LibraryExercise[] = ITEMS.map(([name, emoji, group, defaultWeight, defaultReps, equipment = 'dumbbell']) => ({
  id: `lib-${slug(name)}`,
  name,
  emoji,
  group,
  stepSize: 2.5,
  bodyweight: equipment === 'bodyweight',
  equipment,
  defaultWeight,
  defaultReps,
  defaultSets: 3,
}))

// Pastel per muscle group, used on the workout screen's exercise tiles.
const GROUP_COLOR: Record<string, string> = {
  Shoulders: '#BFD3F0',
  Chest: '#BFD3F0',
  Back: '#C3DDBF',
  Arms: '#CFC3F0',
  Legs: '#F2CDB2',
  Core: '#EEDC9A',
}
const byId = new Map(LIBRARY.map((l) => [l.id, l]))
export const groupOf = (exerciseId: string) => byId.get(exerciseId)?.group ?? 'Custom'
export const groupColor = (exerciseId: string) => GROUP_COLOR[groupOf(exerciseId)] ?? '#A9ABAF'
