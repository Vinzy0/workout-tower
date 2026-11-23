// Web file export/import. Native: swap saveFile for @capacitor/filesystem + @capacitor/share.
export interface Share {
  saveFile(name: string, text: string): Promise<void>
  pickTextFile(): Promise<string | null>
}

export const share: Share = {
  async saveFile(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },

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
