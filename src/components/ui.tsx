import { CaretLeft } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { groupColor } from '../core/library'

export function TopBar({ title, back = '/', right }: { title?: ReactNode; back?: string; right?: ReactNode }) {
  const nav = useNavigate()
  return (
    <header className="safe-top flex items-center gap-2 px-[10px] pb-2">
      <button aria-label="Back" onClick={() => nav(back)} className="press grid h-11 w-11 place-items-center rounded-xl">
        <CaretLeft size={22} />
      </button>
      <div className="min-w-0 flex-1 truncate font-display text-xl font-black">{title}</div>
      {right}
    </header>
  )
}

/** Exercise emoji on its muscle-group pastel. */
export function ExTile({ id, emoji, size = 44 }: { id: string; emoji?: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[14px]"
      style={{ width: size, height: size, fontSize: size * 0.5, background: groupColor(id), boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.18)' }}
    >
      {emoji ?? '❔'}
    </span>
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
