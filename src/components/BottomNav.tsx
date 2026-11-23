import { CalendarCheck, ChartLineUp, Stack, type Icon } from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { haptics } from '../platform/haptics'

const TABS: { to: string; label: string; Icon: Icon }[] = [
  { to: '/history', label: 'History', Icon: CalendarCheck },
  { to: '/', label: 'Tower', Icon: Stack },
  { to: '/stats', label: 'Stats', Icon: ChartLineUp },
]

/** Layout for the three main tabs: page on top, thumb-zone tab bar at the bottom. */
export function TabsLayout() {
  const { pathname } = useLocation()
  return (
    <div className="flex h-full flex-col">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        className="min-h-0 flex-1"
      >
        <Outlet />
      </motion.div>
      <nav className="safe-bottom flex gap-2 px-[18px] pt-2">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => haptics.tick()}
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
