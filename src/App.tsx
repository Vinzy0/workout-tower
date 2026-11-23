import { HashRouter, Route, Routes } from 'react-router'
import { TabsLayout } from './components/BottomNav'
import { Toaster } from './components/toast'
import { History } from './screens/History'
import { Home } from './screens/Home'
import { PastTowers } from './screens/PastTowers'
import { PresetEditor } from './screens/PresetEditor'
import { Presets } from './screens/Presets'
import { SettingsScreen } from './screens/Settings'
import { LiftStats, Stats } from './screens/Stats'
import { Workout } from './screens/Workout'

// HashRouter: works from GitHub Pages subpaths and Capacitor's local server alike.
export function App() {
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
          <Route path="/presets" element={<Presets />} />
          <Route path="/presets/:id" element={<PresetEditor />} />
          <Route path="/workout/:id" element={<Workout />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/past" element={<PastTowers />} />
        </Routes>
      </div>
      <Toaster />
    </HashRouter>
  )
}
