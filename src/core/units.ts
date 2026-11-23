import type { Equipment, Exercise, Unit } from './types'

export const equipmentOf = (ex: Pick<Exercise, 'bodyweight' | 'equipment'>): Equipment =>
  ex.equipment ?? (ex.bodyweight ? 'bodyweight' : 'dumbbell')

/** Column label above the weight wheel. */
export function weightLabel(ex: Pick<Exercise, 'bodyweight' | 'equipment'>, unit: Unit): string {
  const e = equipmentOf(ex)
  if (e === 'bodyweight') return `added ${unit}`
  if (e === 'dumbbell') return `${unit} each`
  return unit
}

const LB = 2.20462

export const toDisplay = (kg: number, unit: Unit) => (unit === 'lb' ? kg * LB : kg)
export const toKg = (v: number, unit: Unit) => Math.round((unit === 'lb' ? v / LB : v) * 1000) / 1000

/** Wheel values 0..max in steps, in the display unit. */
export function weightValues(step: number, unit: Unit): number[] {
  const max = unit === 'lb' ? 330 : 150
  const out: number[] = []
  for (let i = 0; i * step <= max + 1e-9; i++) out.push(Math.round(i * step * 100) / 100)
  return out
}

export const REPS = Array.from({ length: 201 }, (_, i) => i)

export const fmtNum = (n: number) => String(Math.round(n * 100) / 100)

export function fmtWeight(display: number, bodyweight: boolean): string {
  if (bodyweight) return display === 0 ? 'BW' : `+${fmtNum(display)}`
  return fmtNum(display)
}

export const nearestIndex = (values: number[], v: number) => {
  let best = 0
  for (let i = 1; i < values.length; i++) if (Math.abs(values[i] - v) < Math.abs(values[best] - v)) best = i
  return best
}
