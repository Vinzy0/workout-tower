import { CalendarCheck, ChartLineUp, Stack, type Icon } from '@phosphor-icons/react'
import { NavLink, Outlet } from 'react-router'

const TABS: { to: string; label: string; Icon: Icon }[] = [
  { to: '/', label: 'Tower', Icon: Stack },
  { to: '/history', label: 'History', Icon: CalendarCheck },
  { to: '/stats', label: 'Stats', Icon: ChartLineUp },
]

/** Layout for the three main tabs: page on top, thumb-zone tab bar at the bottom. */
export function TabsLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
      <nav className="safe-bottom flex gap-2 px-[18px] pt-2">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `press flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-extrabold transition-colors ${
                isActive ? 'bg-surface text-text' : 'text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
