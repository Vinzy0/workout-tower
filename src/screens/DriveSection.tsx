import { CloudArrowUp } from '@phosphor-icons/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { ask } from '../components/ask'
import { toast } from '../components/toast'
import { connectDrive, disconnectDrive, getDriveState, syncNow } from '../sync'
import { Section } from './Settings'

const when = (t: number) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export function DriveSection() {
  const drive = useLiveQuery(getDriveState)
  const [busy, setBusy] = useState(false)
  if (!drive) return null

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    try {
      await fn()
      toast(ok)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setBusy(false)
    }
  }

  if (!drive.connected) {
    return (
      <Section title="Google Drive" hint="Backs up to a hidden app folder in your Drive. Works without it too.">
        <button
          disabled={busy}
          onClick={() =>
            run(
              () => connectDrive((t) => ask(`Drive has newer data (saved ${when(t)}). Restore from Drive?\nIt merges, nothing on this phone is deleted.`, 'Restore', false)),
              'Drive connected',
            )
          }
          className="chunky flex w-full items-center gap-3 rounded-[18px] bg-connect [--lip:#e9a57a] p-4 text-left text-on-pastel disabled:opacity-60"
        >
          <CloudArrowUp size={24} weight="duotone" />
          <span className="flex-1 font-display font-black">{busy ? 'Connecting…' : 'Connect Google Drive'}</span>
          <span className="chip bg-white/40">Connect ↗</span>
        </button>
      </Section>
    )
  }

  return (
    <Section title="Google Drive">
      <div className="row mb-2 flex items-center gap-2 px-4 py-3 text-sm">
        <span className={`h-[7px] w-[7px] rounded-full ${drive.error ? 'bg-attention-chip' : 'bg-healthy-chip'}`} />
        <span className="flex-1">{drive.error ? 'Not synced' : drive.lastSynced ? `Synced ${when(drive.lastSynced)}` : 'Connected'}</span>
      </div>
      {drive.error && <p className="mb-2 text-xs text-muted">{drive.error}</p>}
      <div className="flex gap-2">
        <button disabled={busy} onClick={() => run(syncNow, 'Synced')} className="row press h-12 flex-1 disabled:opacity-60">
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
        <button onClick={() => run(disconnectDrive, 'Drive disconnected')} className="row press h-12 flex-1 text-muted">
          Disconnect
        </button>
      </div>
    </Section>
  )
}
