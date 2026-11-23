// Take or pick a photo. Native app: @capacitor/camera. Web: a file input (opens the camera on phones).
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

/** Returns a data URL, or null if cancelled. */
export async function pickPhoto(from: 'camera' | 'library'): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const p = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: from === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        quality: 85,
        saveToGallery: from === 'camera', // your gym pics also land in the phone's gallery
        width: 1600,
      })
      return p.dataUrl ?? null
    } catch {
      return null // cancelled
    }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (from === 'camera') input.capture = 'environment'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = () => resolve(null)
      r.readAsDataURL(file)
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Scale so the long side is at most `max` px (or center-crop to a `max` square). JPEG data URL. */
export async function resize(dataUrl: string, max: number, square = false): Promise<string> {
  const img = await load(dataUrl)
  const c = document.createElement('canvas')
  const g = c.getContext('2d')!
  if (square) {
    const s = Math.min(img.width, img.height)
    c.width = c.height = Math.min(max, s)
    g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, c.width, c.height)
  } else {
    const k = Math.min(1, max / Math.max(img.width, img.height))
    c.width = Math.round(img.width * k)
    c.height = Math.round(img.height * k)
    g.drawImage(img, 0, 0, c.width, c.height)
  }
  return c.toDataURL('image/jpeg', 0.82)
}
