import { CaretLeft } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

export function TopBar({ title, back = '/', right }: { title?: ReactNode; back?: string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="safe-top flex items-center gap-2 px-[10px] pb-2">
      <button aria-label="Back" onClick={() => nav(back)} className="press grid h-11 w-11 place-items-center rounded-xl">
        <CaretLeft size={22} />
      </button>
      <div className="min-w-0 flex-1 truncate font-[Rubik] text-lg font-medium">{title}</div>
      {right}
    </header>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  format = String,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
  format?: (v: T) => string
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface p-1">
      {options.map((o) => (
        <button
          key={String(o)}
          onClick={() => onChange(o)}
          className={`press tabular h-10 flex-1 rounded-lg text-sm transition-colors ${
            o === value ? 'bg-text font-medium text-bg' : 'text-muted'
          }`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}
