import { useLiveQuery } from 'dexie-react-hooks'
import type { ReactNode } from 'react'
import { toast } from '../components/toast'
import { Segmented } from '../components/ui'
import { isDump } from '../core/merge'
import { goalAt } from '../core/tower'
import { auth } from '../platform/auth'
import { share } from '../platform/share'
import { sound } from '../platform/sound'
import { storage } from '../platform/storage'
import { DriveSection } from './DriveSection'

/** All settings, shown inline on the Profile page (one tap from the Tower). */
export function SettingsSections() {
  const goals = useLiveQuery(storage.listGoals)
  const settings = useLiveQuery(storage.getSettings)
  if (!goals || !settings) return null

  const exportJson = async () => {
    const dump = await storage.exportAll()
    const day = new Date().toISOString().slice(0, 10)
    await share.saveFile(`workout-tower-${day}.json`, JSON.stringify(dump, null, 1))
  }

  const importJson = async () => {
    const text = await share.pickTextFile()
    if (!text) return
    try {
      const data = JSON.parse(text)
      if (!isDump(data)) throw new Error()
      await storage.importMerge(data)
      toast('Imported and merged')
    } catch {
      toast('That file is not a Tower backup')
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Workouts per week" hint="Changing it only affects this week onward.">
        <Segmented options={[1, 2, 3, 4, 5, 6, 7] as const} value={goalAt(goals, Date.now()) as 1} onChange={(g) => storage.setGoal(g)} />
      </Section>

      <Section title="Unit">
        <Segmented options={['kg', 'lb'] as const} value={settings.unit} onChange={(unit) => storage.putSettings({ ...settings, unit })} />
      </Section>

      <Section title="Sounds">
        <Segmented
          options={['On', 'Off'] as const}
          value={settings.sound === false ? 'Off' : 'On'}
          onChange={(v) => {
            storage.putSettings({ ...settings, sound: v === 'On' })
            if (v === 'On') setTimeout(sound.done, 50)
          }}
        />
      </Section>

      {auth.available && <DriveSection />}

      <Section title="Backup" hint="A JSON file with your workouts and settings (photos stay on this phone). Import merges, it never deletes.">
        <div className="flex gap-2">
          <button onClick={exportJson} className="row press h-12 flex-1 font-extrabold">
            Export
          </button>
          <button onClick={importJson} className="row press h-12 flex-1 font-extrabold">
            Import
          </button>
        </div>
      </Section>
    </div>
  )
}

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-base">{title}</h2>
      {hint && <p className="mb-2 text-xs font-semibold text-muted">{hint}</p>}
      {children}
    </section>
  )
}
