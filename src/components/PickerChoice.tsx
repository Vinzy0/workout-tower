import type { Picker } from '../core/types'
import { haptics } from '../platform/haptics'

/** Two mini mock-ups of the workout screen so you can pick where the exercise list goes. */
export function PickerChoice({ value, onChange }: { value: Picker; onChange: (p: Picker) => void }) {
  const opt = (p: Picker, label: string, hint: string) => {
    const on = value === p
    const tile = (k: number) => <span key={k} className="h-4 w-4 shrink-0 rounded-[5px] bg-people" style={{ opacity: k === 1 ? 1 : 0.5 }} />
    const card = <span className="block h-7 flex-1 rounded-md bg-[#2c2c31]" />
    return (
      <button
        onClick={() => {
          haptics.tick()
          onChange(p)
        }}
        className={`chunky flex flex-1 flex-col items-center gap-2 rounded-2xl p-3 transition-colors ${
          on ? 'bg-healthy text-on-pastel [--lip:#8fbf88]' : 'bg-surface [--lip:#26262b]'
        }`}
      >
        <span className="flex h-36 w-24 flex-col gap-1.5 rounded-xl bg-bg p-2">
          {p === 'bottom' ? (
            <>
              <span className="flex gap-1">{card}{card}</span>
              <span className="flex gap-1">{card}{card}</span>
              <span className="mt-auto mb-0.5 h-0 w-0 self-center border-x-[5px] border-t-[6px] border-x-transparent border-t-text" />
              <span className="flex justify-center gap-1.5">{[0, 1, 2].map(tile)}</span>
            </>
          ) : (
            <span className="flex h-full gap-1.5">
              <span className="flex flex-col justify-center gap-1.5">{[0, 1, 2].map(tile)}</span>
              <span className="flex flex-1 flex-col gap-1">
                <span className="flex gap-1">{card}</span>
                <span className="flex gap-1">{card}</span>
              </span>
            </span>
          )}
        </span>
        <span className="font-display text-base font-black">{label}</span>
        <span className={`text-xs font-semibold ${on ? 'opacity-75' : 'text-muted'}`}>{hint}</span>
      </button>
    )
  }
  return (
    <div className="flex w-full gap-3">
      {opt('bottom', 'Bottom', 'Exercises in your thumb zone')}
      {opt('side', 'Side', 'Exercises in a column')}
    </div>
  )
}
