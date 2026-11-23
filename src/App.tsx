import { HashRouter, Route, Routes } from 'react-router'
import { Toaster } from './components/toast'
import { Home } from './screens/Home'
import { PastTowers } from './screens/PastTowers'
import { PresetEditor } from './screens/PresetEditor'
import { Presets } from './screens/Presets'
import { SettingsScreen } from './screens/Settings'
import { Workout } from './screens/Workout'

// HashRouter: works from GitHub Pages subpaths and Capacitor's local server alike.
export function App() {
  return (
    <HashRouter>
      <div className="mx-auto h-full max-w-[480px]">
        <Routes>
          <Route path="/" element={<Home />} />
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
