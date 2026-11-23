// Google Drive backup/sync via the appDataFolder (scope drive.appdata only).
// One file, workout-data.json, holding the full export. Local data stays the source of truth:
// every sync merges by record id + updatedAt, then uploads the merged result.
// Drive REST calls are plain fetch and stay the same in the native build; only auth.ts swaps.
import { isDump } from './core/merge'
import type { DataDump } from './core/types'
import { auth } from './platform/auth'
import { storage } from './platform/storage'

const FILE = 'workout-data.json'
const API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

export type DriveState = { connected: boolean; lastSynced?: number; error?: string }
export const getDriveState = async () => (await storage.getKv<DriveState>('drive')) ?? { connected: false }
const setDriveState = async (patch: Partial<DriveState>) => storage.setKv('drive', { ...(await getDriveState()), ...patch })

async function call(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } })
  if (!res.ok) throw new Error(`Drive ${res.status}: ${(await res.text()).slice(0, 120)}`)
  return res
}

async function findFile(token: string): Promise<string | undefined> {
  const q = encodeURIComponent(`name='${FILE}'`)
  const res = await call(token, `${API}?spaces=appDataFolder&q=${q}&fields=files(id)&pageSize=1`)
  return (await res.json()).files?.[0]?.id
}

async function download(token: string, id: string): Promise<DataDump | undefined> {
  const data = await (await call(token, `${API}/${id}?alt=media`)).json()
  return isDump(data) ? data : undefined
}

async function upload(token: string, id: string | undefined, dump: DataDump) {
  const body = JSON.stringify(dump)
  if (id) {
    await call(token, `${UPLOAD}/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
    return
  }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name: FILE, parents: ['appDataFolder'] })], { type: 'application/json' }))
  form.append('file', new Blob([body], { type: 'application/json' }))
  await call(token, `${UPLOAD}?uploadType=multipart&fields=id`, { method: 'POST', body: form })
}

async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  try {
    const r = await fn()
    await setDriveState({ lastSynced: Date.now(), error: undefined })
    return r
  } catch (e) {
    await setDriveState({ error: e instanceof Error ? e.message : String(e) })
    throw e
  }
}

/**
 * Connect from a tap. If Drive holds newer data, `askRestore` decides:
 * yes = merge Drive into this device, no = this device's data replaces the Drive file.
 */
export async function connectDrive(askRestore: (remoteUpdatedAt: number) => Promise<boolean>) {
  const token = await auth.getAccessToken() // first thing in the tap, so the popup is allowed
  await setDriveState({ connected: true })
  return guarded(async () => {
    const id = await findFile(token)
    const remote = id ? await download(token, id) : undefined
    const local = await storage.exportAll()
    if (remote && remote.updatedAt > local.updatedAt && (await askRestore(remote.updatedAt))) await storage.importMerge(remote)
    await upload(token, id, await storage.exportAll())
  })
}

/** Two-way: merge Drive into local, upload the result. */
export async function syncNow() {
  const token = await auth.getAccessToken()
  return guarded(async () => {
    const id = await findFile(token)
    const remote = id ? await download(token, id) : undefined
    if (remote) await storage.importMerge(remote)
    await upload(token, id, await storage.exportAll())
  })
}

export async function disconnectDrive() {
  await auth.signOut()
  await storage.setKv('drive', { connected: false })
}

/** Called from the Finish tap. Never throws: a failure just leaves the "not synced" badge. */
export function syncAfterWorkout() {
  if (!auth.available) return
  getDriveState().then((s) => {
    if (s.connected) syncNow().catch(() => {})
  })
}
