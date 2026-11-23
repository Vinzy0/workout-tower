// Files. Web: download link + file input. Android app: the phone's Documents/Tower folder,
// which survives uninstalling the app or clearing its storage.
import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'

export interface Share {
  /** True in the Android app: files land in Documents/Tower without asking. */
  readonly writesToDocuments: boolean
  /** Saves a text file. Returns where it went (shown to the user). */
  saveFile(name: string, text: string): Promise<string>
  pickTextFile(): Promise<string | null>
}

const native = Capacitor.isNativePlatform()
const FOLDER = 'Tower'

export const share: Share = {
  writesToDocuments: native,

  async saveFile(name, text) {
    if (native) {
      await Filesystem.requestPermissions().catch(() => {}) // only matters on Android 10 and older
      await Filesystem.writeFile({ path: `${FOLDER}/${name}`, data: text, directory: Directory.Documents, encoding: Encoding.UTF8, recursive: true })
      return `Documents/${FOLDER}/${name}`
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return `Downloads/${name}`
  },

  // The system file picker can read any file, including backups an older install wrote.
  pickTextFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json,.json'
      input.onchange = async () => resolve(input.files?.[0] ? await input.files[0].text() : null)
      input.oncancel = () => resolve(null)
      input.click()
    })
  },
}
