// App-shell differences between the web (PWA) and the Android app (Capacitor).
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { registerSW } from 'virtual:pwa-register'

export const isNative = Capacitor.isNativePlatform()

export function initPlatform() {
  if (isNative) {
    // Android back button: go back inside the app, exit from the first screen.
    App.addListener('backButton', ({ canGoBack }) => (canGoBack ? window.history.back() : App.exitApp()))
  } else {
    // Offline support on the web only. In the APK the files ship inside the app,
    // and a service worker there could keep serving an old version after an update.
    registerSW({ immediate: true })
  }
}
