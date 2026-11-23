// Web haptics via navigator.vibrate. Native: swap for @capacitor/haptics (see NATIVE_MIGRATION.md).
export interface Haptics {
  tick(): void // wheel detent
  tap(): void // button press
  success(): void // set done, week complete
  heavy(): void // block slam, crack, collapse
}

const vibrate = (p: number | number[]) => {
  if ('vibrate' in navigator) navigator.vibrate(p)
}

export const haptics: Haptics = {
  tick: () => vibrate(5),
  tap: () => vibrate(10),
  success: () => vibrate([15, 40, 25]),
  heavy: () => vibrate([40, 30, 80]),
}
