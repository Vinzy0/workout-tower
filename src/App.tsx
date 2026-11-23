import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { setSoundEnabled } from './platform/sound'
import { storage } from './platform/storage'
import { TabsLayout } from './components/BottomNav'
import { AskHost } from './components/ask'
import { Toaster } from './components/toast'
import { History } from './screens/History'
import { Home } from './screens/Home'
import { PastTowers } from './screens/PastTowers'
import { PresetEditor } from './screens/PresetEditor'
import { Onboarding } from './screens/Onboarding'
import { Profile } from './screens/Profile'
import { LiftStats, Stats } from './screens/Stats'
import { Workout } from './screens/Workout'
import { Done } from './screens/Done'

// HashRouter: works from GitHub Pages subpaths and Capacitor's local server alike.
export function App() {
  const sound = useLiveQuery(storage.getSettings)?.sound
  useEffect(() => setSoundEnabled(sound !== false), [sound])
  return (
    <HashRouter>
      <div className="mx-auto h-full max-w-[480px]">
        <Routes>
          <Route element={<TabsLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/stats/:id" element={<LiftStats />} />
          </Route>
          <Route path="/presets/:id" element={<PresetEditor />} />
          <Route path="/workout/:id" element={<Workout />} />
          <Route path="/done/:id" element={<Done />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
          <Route path="/welcome" element={<Onboarding />} />
          <Route path="/past" element={<PastTowers />} />
        </Routes>
      </div>
      <Toaster />
      <AskHost />
    </HashRouter>
  )
}
