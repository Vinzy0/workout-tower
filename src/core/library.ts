import type { Exercise } from './types'

// Built-in exercise library. Weights are per dumbbell, in kg.
// Library ids are stable ("lib-<slug>") so the same exercise shares history across presets.
type Item = [name: string, emoji: string, group: string, defaultWeight: number, defaultReps: number, bodyweight?: true]

const ITEMS: Item[] = [
  // Shoulders
  ['DB shoulder press', '🏋️', 'Shoulders', 10, 10],
  ['Arnold press', '🌀', 'Shoulders', 7.5, 10],
  ['Lateral raise', '🪽', 'Shoulders', 5, 12],
  ['Front raise', '🙌', 'Shoulders', 5, 12],
  ['Rear delt fly', '🦅', 'Shoulders', 5, 12],
  ['Upright row', '🪜', 'Shoulders', 7.5, 12],
  ['Shrugs', '🤷', 'Shoulders', 15, 12],
  // Chest
  ['DB bench press', '🛋️', 'Chest', 12.5, 10],
  ['Incline DB press', '📐', 'Chest', 10, 10],
  ['DB floor press', '🛏️', 'Chest', 12.5, 10],
  ['DB fly', '🦋', 'Chest', 7.5, 12],
  ['Push-up', '🫸', 'Chest', 0, 12, true],
  ['Diamond push-up', '💎', 'Chest', 0, 10, true],
  ['Pike push-up', '🔺', 'Chest', 0, 8, true],
  // Back
  ['One-arm DB row', '🚣', 'Back', 15, 10],
  ['Renegade row', '🛶', 'Back', 7.5, 8],
  ['DB pullover', '🌈', 'Back', 10, 12],
  ['Pull-up', '🧗', 'Back', 0, 6, true],
  ['Chin-up', '🪝', 'Back', 0, 6, true],
  ['Inverted row', '🔄', 'Back', 0, 10, true],
  ['Superman', '🦸', 'Back', 0, 12, true],
  // Arms
  ['DB curl', '💪', 'Arms', 10, 10],
  ['Hammer curl', '🔨', 'Arms', 10, 10],
  ['Concentration curl', '🎯', 'Arms', 7.5, 10],
  ['Overhead triceps extension', '🙆', 'Arms', 10, 12],
  ['Triceps kickback', '🐎', 'Arms', 5, 12],
  ['DB skull crusher', '💀', 'Arms', 7.5, 10],
  ['Dips', '⬇️', 'Arms', 0, 8, true],
  // Legs
  ['Goblet squat', '🏆', 'Legs', 15, 10],
  ['DB lunge', '🚶', 'Legs', 10, 10],
  ['Bulgarian split squat', '🦩', 'Legs', 7.5, 8],
  ['DB Romanian deadlift', '🪵', 'Legs', 15, 10],
  ['DB step-up', '📦', 'Legs', 7.5, 10],
  ['DB calf raise', '🦶', 'Legs', 15, 15],
  ['Glute bridge', '🍑', 'Legs', 0, 15, true],
  ['Bodyweight squat', '🦵', 'Legs', 0, 15, true],
  ['Jump squat', '🦘', 'Legs', 0, 12, true],
  // Core
  ['Plank (reps = seconds)', '🧱', 'Core', 0, 30, true],
  ['Crunch', '🔥', 'Core', 0, 15, true],
  ['Russian twist', '🌪️', 'Core', 5, 20],
  ['Hanging leg raise', '🦿', 'Core', 0, 10, true],
  ['Mountain climber', '🏔️', 'Core', 0, 20, true],
  ['Bicycle crunch', '🚲', 'Core', 0, 20, true],
  ['DB side bend', '🎋', 'Core', 10, 12],
]

export type LibraryExercise = Omit<Exercise, 'updatedAt'> & { group: string }

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const LIBRARY: LibraryExercise[] = ITEMS.map(([name, emoji, group, defaultWeight, defaultReps, bw]) => ({
  id: `lib-${slug(name)}`,
  name,
  emoji,
  group,
  stepSize: 2.5,
  bodyweight: !!bw,
  defaultWeight,
  defaultReps,
  defaultSets: 3,
}))
