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

// One-line "what it hits / how" shown under each exercise in the library.
const DESC: Record<string, string> = {
  'DB shoulder press': 'Front + side delts. Press overhead from ear height.',
  'Arnold press': 'All three delt heads. Rotate palms out as you press.',
  'Lateral raise': 'Side delts. Lift out to shoulder height, slow down.',
  'Front raise': 'Front delts. Raise straight ahead to eye level.',
  'Rear delt fly': 'Rear delts + upper back. Hinge over, open the arms.',
  'Upright row': 'Side delts + traps. Pull up along the body to the chest.',
  Shrugs: 'Traps. Lift shoulders to ears, pause, lower.',
  'Cable lateral raise': 'Side delts with constant tension. One arm at a time.',
  'Face pull': 'Rear delts + rotator cuff. Rope to the face, elbows high.',
  'DB bench press': 'Chest, front delts, triceps. Lower to chest level.',
  'Incline DB press': 'Upper chest. Bench at 30 to 45 degrees.',
  'DB floor press': 'Chest + triceps, shoulder friendly. Elbows touch the floor.',
  'DB fly': 'Chest stretch. Wide arc, slight bend in the elbows.',
  'Push-up': 'Chest, triceps, core. Body in one straight line.',
  'Diamond push-up': 'Triceps focus. Hands together under the chest.',
  'Pike push-up': 'Shoulders. Hips high, head toward the floor.',
  'One-arm DB row': 'Lats + mid back. Pull the elbow to the hip.',
  'Renegade row': 'Back + core. Row from a plank without twisting.',
  'DB pullover': 'Lats + chest. Arc the weight behind your head.',
  'Pull-up': 'Lats + biceps. Overhand grip, chin over the bar.',
  'Chin-up': 'Biceps + lats. Palms facing you.',
  'Inverted row': 'Upper back. Pull your chest to a low bar.',
  Superman: 'Lower back + glutes. Lift arms and legs off the floor.',
  'Lat pulldown': 'Lats. Pull the bar to your upper chest.',
  'Seated cable row': 'Mid back. Squeeze the shoulder blades together.',
  'DB curl': 'Biceps. Elbows pinned, no swinging.',
  'Hammer curl': 'Biceps + forearms. Neutral grip, thumbs up.',
  'Concentration curl': 'Biceps peak. Elbow braced on the inner thigh.',
  'Overhead triceps extension': 'Triceps long head. Lower behind the head.',
  'Triceps kickback': 'Triceps. Hinge over, straighten the arm back.',
  'DB skull crusher': 'Triceps. Lying down, lower to the sides of the head.',
  Dips: 'Triceps + chest. Lower until elbows hit 90 degrees.',
  'Cable triceps pushdown': 'Triceps. Push the bar or rope down, elbows still.',
  'Cable overhead triceps extension': 'Triceps long head. Face away, press overhead.',
  'Cable curl': 'Biceps with constant tension. Elbows by your sides.',
  'Preacher curl (EZ bar)': 'Biceps. Arms on the pad, no cheating.',
  'Goblet squat': 'Quads + glutes. Hold one dumbbell at the chest.',
  'DB lunge': 'Quads + glutes. Step forward, back knee toward the floor.',
  'Bulgarian split squat': 'Quads + glutes. Back foot up on a bench.',
  'DB Romanian deadlift': 'Hamstrings + glutes. Hinge at the hips, flat back.',
  'DB step-up': 'Quads + glutes. Drive up through the front heel.',
  'DB calf raise': 'Calves. Full stretch at the bottom, pause at the top.',
  'Glute bridge': 'Glutes. Squeeze at the top for a second.',
  'Bodyweight squat': 'Quads + glutes. Sit back, chest up.',
  'Jump squat': 'Power + legs. Squat, then explode up.',
  'Plank (reps = seconds)': 'Core. Log the seconds you held as reps.',
  Crunch: 'Abs. Curl the shoulders off the floor.',
  'Russian twist': 'Obliques. Rotate side to side, feet up if you can.',
  'Hanging leg raise': 'Lower abs. Raise legs without swinging.',
  'Mountain climber': 'Core + cardio. Drive knees to chest fast.',
  'Bicycle crunch': 'Abs + obliques. Elbow to opposite knee.',
  'DB side bend': 'Obliques. Lean side to side, one dumbbell.',
}
const descById = new Map(LIBRARY.map((l) => [l.id, DESC[l.name]]))
export const descOf = (exerciseId: string) => descById.get(exerciseId)
