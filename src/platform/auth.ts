// Web auth: Google Identity Services token model (client-side only, no backend).
// Native: Google blocks OAuth in WebViews (disallowed_useragent), so swap this file for a native
// Google sign-in plugin that returns an access token with the same scope. See NATIVE_MIGRATION.md.

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

export interface Auth {
  /** False when no client ID is configured: hide every Drive feature. */
  readonly available: boolean
  /** Must be called from a user tap. Reuses a still-valid token without a popup. */
  getAccessToken(): Promise<string>
  signOut(): Promise<void>
}

type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string }
type TokenClient = { requestAccessToken(o?: { prompt?: string }): void }
type Gis = {
  accounts: {
    oauth2: {
      initTokenClient(c: {
        client_id: string
        scope: string
        callback: (r: TokenResponse) => void
        error_callback?: (e: { type: string; message?: string }) => void
      }): TokenClient
      hasGrantedAllScopes(r: TokenResponse, ...scopes: string[]): boolean
      revoke(token: string, done?: () => void): void
    }
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

let gis: Gis | undefined
let token: { value: string; expiresAt: number } | undefined
let pending: { resolve: (t: string) => void; reject: (e: Error) => void } | undefined
let client: TokenClient | undefined

/** Preload the GIS script at startup so requestAccessToken runs inside the tap (no popup blocking). */
function load(): Promise<Gis> {
  if (gis) return Promise.resolve(gis)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => {
      gis = (window as unknown as { google: Gis }).google
      resolve(gis)
    }
    s.onerror = () => reject(new Error('Could not load Google sign-in (offline?)'))
    document.head.appendChild(s)
  })
}

function getClient(g: Gis): TokenClient {
  client ??= g.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID!,
    scope: DRIVE_SCOPE,
    callback: (r) => {
      const p = pending
      pending = undefined
      if (!p) return
      if (r.error || !r.access_token) return p.reject(new Error(r.error_description || r.error || 'Sign-in failed'))
      if (!g.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)) return p.reject(new Error('Drive access was not granted'))
      token = { value: r.access_token, expiresAt: Date.now() + ((r.expires_in ?? 3600) - 60) * 1000 }
      p.resolve(token.value)
    },
    error_callback: (e) => {
      pending?.reject(new Error(e.type === 'popup_closed' ? 'Sign-in closed' : e.message || e.type))
      pending = undefined
    },
  })
  return client
}

if (CLIENT_ID) load().catch(() => {})

export const auth: Auth = {
  available: !!CLIENT_ID,

  getAccessToken() {
    if (token && token.expiresAt > Date.now()) return Promise.resolve(token.value)
    if (!gis) return load().then(() => auth.getAccessToken())
    const c = getClient(gis)
    return new Promise((resolve, reject) => {
      pending = { resolve, reject }
      c.requestAccessToken({ prompt: '' })
    })
  },

  async signOut() {
    if (token && gis) gis.accounts.oauth2.revoke(token.value)
    token = undefined
  },
}
