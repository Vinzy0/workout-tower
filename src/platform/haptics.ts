// Haptics + matching sound. Native app: @capacitor/haptics. Web: navigator.vibrate.
import { Capacitor } from '@capacitor/core'
import { Haptics as Native, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { sound } from './sound'

export interface Haptics {
  tick(): void // number detent
  tap(): void // button press
  success(): void // set/exercise done
  heavy(): void // block slam, crack, collapse
}

const native = Capacitor.isNativePlatform()
const vibrate = (p: number | number[]) => {
  if ('vibrate' in navigator) navigator.vibrate(p)
}

export const haptics: Haptics = {
  tick: () => {
    sound.tick()
    if (native) Native.selectionChanged()
    else vibrate(5)
  },
  tap: () => {
    sound.tap()
    if (native) Native.impact({ style: ImpactStyle.Light })
    else vibrate(10)
  },
  success: () => {
    sound.done()
    if (native) Native.notification({ type: NotificationType.Success })
    else vibrate([15, 40, 25])
  },
  heavy: () => {
    sound.slam()
    if (native) Native.impact({ style: ImpactStyle.Heavy })
    else vibrate([40, 30, 80])
  },
}
