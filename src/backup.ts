// Full backups (workouts + settings + photos) and restoring them.
// In the Android app a backup is written to Documents/Tower after every workout, so data survives
// uninstalling the app or clearing its storage. On the web it's the manual Export button.
import { isDump } from './core/merge'
import type { DataDump } from './core/types'
import { resize } from './platform/camera'
import { share } from './platform/share'
import { storage } from './platform/storage'

type Backup = DataDump & { photos?: { id: string; data: string }[] }
export type BackupState = { at?: number; path?: string; error?: string }

const MAIN = 'tower-backup.json'

export async function backupJson(): Promise<string> {
  const [dump, photos] = await Promise.all([storage.exportAll(), storage.listPhotos()])
  return JSON.stringify({ ...dump, photos } satisfies Backup)
}

/** Writes the backup file. Android 11+ only lets an app overwrite files it created itself, so after
 *  a reinstall the old file can't be replaced: then we start a new file and keep using that one. */
export async function backupNow(): Promise<string> {
  const json = await backupJson()
  const name = (await storage.getKv<string>('backupFile')) ?? MAIN
  let path: string
  try {
    path = await share.saveFile(name, json)
  } catch {
    const fresh = `tower-backup-${new Date().toISOString().slice(0, 10)}-${Date.now() % 100000}.json`
    path = await share.saveFile(fresh, json)
    await storage.setKv('backupFile', fresh)
  }
  await storage.setKv('backup', { at: Date.now(), path } satisfies BackupState)
  return path
}

/** Silent auto backup (Android app only). Never throws. */
export function autoBackup() {
  if (!share.writesToDocuments) return
  backupNow().catch((e) => storage.setKv('backup', { at: Date.now(), error: String(e?.message ?? e) } satisfies BackupState))
}

/** Restores from a backup file: merges records by id (nothing local is deleted) and adds missing photos. */
export async function restoreFromText(text: string): Promise<{ sessions: number; photos: number }> {
  const data = JSON.parse(text) as Backup
  if (!isDump(data)) throw new Error('That file is not a Tower backup')
  await storage.importMerge(data)
  let photos = 0
  for (const p of data.photos ?? []) {
    if (await storage.hasPhoto(p.id)) continue
    await storage.putPhoto(p.id, p.data, await resize(p.data, 240, true))
    photos++
  }
  return { sessions: data.sessions.filter((s) => s.finished && !s.deleted).length, photos }
}
