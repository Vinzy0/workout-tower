import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type ReactNode } from 'react'
import { backupNow, restoreFromText, type BackupState } from '../backup'
import { ask } from '../components/ask'
import { toast } from '../components/toast'
import { Segmented } from '../components/ui'
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

  return (
    <div className="space-y-6">
      <Section title="Workouts per week" hint="Changing it only affects this week onward.">
        <Segmented options={[1, 2, 3, 4, 5, 6, 7] as const} value={goalAt(goals, Date.now()) as 1} onChange={(g) => storage.setGoal(g)} />
      </Section>

      <Section title="Unit">
        <Segmented options={['kg', 'lb'] as const} value={settings.unit} onChange={(unit) => storage.putSettings({ ...settings, unit })} />
      </Section>

      <Section title="Exercise list in a workout" hint="Bottom keeps the exercises in your thumb zone. Side puts them in a column.">
        <Segmented
          options={['Bottom', 'Side'] as const}
          value={settings.picker === 'side' ? 'Side' : 'Bottom'}
          onChange={(v) => storage.putSettings({ ...settings, picker: v === 'Side' ? 'side' : 'bottom' })}
        />
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

      <BackupSection />

      <Section title="Delete all data" hint="Removes every workout, photo, your tower and profile from this app. Backup files in Documents/Tower are not touched.">
        <button onClick={deleteEverything} className="row press h-12 w-full font-extrabold text-error">
          Delete all data…
        </button>
      </Section>
    </div>
  )
}

/** Asks twice, then wipes the local database and restarts the app. */
async function deleteEverything() {
  if (!(await ask('Delete ALL your data?\nEvery workout, photo, your tower and profile on this phone.', 'Continue'))) return
  if (!(await ask('Are you really sure?\nThis cannot be undone. Make a backup first if you might want it back.', 'Delete everything'))) return
  await storage.wipeAll()
  window.location.replace(window.location.pathname) // restart at the start (onboarding)
}

function BackupSection() {
  const state = useLiveQuery(() => storage.getKv<BackupState>('backup'))
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<string | void>) => {
    setBusy(true)
    try {
      const msg = await fn()
      if (msg) toast(msg)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }
  const restore = () =>
    run(async () => {
      const text = await share.pickTextFile()
      if (!text) return
      const r = await restoreFromText(text)
      return `Restored ${r.sessions} workouts and ${r.photos} photos`
    })

  return (
    <Section
      title="Backup"
      hint={
        share.writesToDocuments
          ? 'Saved automatically after every workout to Documents/Tower on your phone, so it survives uninstalling the app. Includes photos.'
          : 'Download a file with your workouts, settings and photos. Restore merges, it never deletes.'
      }
    >
      {share.writesToDocuments && (
        <div className="row mb-2 flex items-center gap-2 px-4 py-3 text-sm font-semibold">
          <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${state?.error ? 'bg-error' : state?.at ? 'bg-healthy-chip' : 'bg-faint'}`} />
          <span className="min-w-0 flex-1 truncate">
            {state?.error
              ? `Last backup failed: ${state.error}`
              : state?.at
                ? `Last backup ${new Date(state.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · ${state.path}`
                : 'No backup yet'}
          </span>
        </div>
      )}
      <div className="flex gap-2">
        <button disabled={busy} onClick={() => run(async () => `Saved to ${await backupNow()}`)} className="row press h-12 flex-1 font-extrabold disabled:opacity-50">
          {share.writesToDocuments ? 'Back up now' : 'Export'}
        </button>
        <button disabled={busy} onClick={restore} className="row press h-12 flex-1 font-extrabold disabled:opacity-50">
          Restore from file
        </button>
      </div>
    </Section>
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
