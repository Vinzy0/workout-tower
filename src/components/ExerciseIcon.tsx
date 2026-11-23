import { groupColor } from '../core/library'
import type { Equipment, Exercise } from '../core/types'
import { equipmentOf } from '../core/units'

// Simple stroke glyphs per equipment, drawn on the muscle-group pastel (like Vince's prototype).
const GLYPH: Record<Equipment, React.ReactNode> = {
  dumbbell: (
    <>
      <rect x="4.5" y="6.5" width="3" height="11" rx="1" />
      <rect x="16.5" y="6.5" width="3" height="11" rx="1" />
      <path d="M2.5 10v4M21.5 10v4M7.5 12h9" />
    </>
  ),
  barbell: <path d="M2 12h20M5 8.5v7M8 6.5v11M16 6.5v11M19 8.5v7" />,
  cable: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5V15M8 15h8l-1.2 4.5H9.2Z" />
    </>
  ),
  bodyweight: (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 7.5v6.5M12 14l-3.5 6M12 14l3.5 6M6 10h12" />
    </>
  ),
}

export function EquipmentGlyph({ equipment, size = 24 }: { equipment: Equipment; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {GLYPH[equipment]}
    </svg>
  )
}

/** Exercise tile: muscle-group pastel + equipment glyph. */
export function ExTile({
  id,
  ex,
  size = 44,
  radius,
}: {
  id: string
  ex?: Pick<Exercise, 'bodyweight' | 'equipment'>
  size?: number
  radius?: number
}) {
  return (
    <span
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size * 0.32,
        background: groupColor(id),
        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.18)',
      }}
    >
      <EquipmentGlyph equipment={ex ? equipmentOf(ex) : 'dumbbell'} size={size * 0.5} />
    </span>
  )
}
