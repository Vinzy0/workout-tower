// Generates the PWA icons, plus Android launcher icons and splash screens, with no image deps.
// Run: node scripts/make-icons.mjs   (after `npx cap add android` to also write the Android ones)
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [13, 13, 15]
const BLOCKS = [
  { color: [201, 162, 126], shade: [150, 115, 85] }, // wood
  { color: [167, 169, 172], shade: [118, 120, 124] }, // stone
  { color: [227, 199, 122], shade: [176, 150, 80] }, // gold
]

function crcTable() {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
}
const TABLE = crcTable()
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}

function inRoundRect(x, y, rx, ry, w, h, r) {
  if (x < rx || y < ry || x >= rx + w || y >= ry + h) return false
  const cx = Math.min(Math.max(x, rx + r), rx + w - r)
  const cy = Math.min(Math.max(y, ry + r), ry + h - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}

/** Draws the tower centered in a W×H PNG; `box` is the size of the square it fits in. */
function render(W, H = W, box = Math.min(W, H) * 0.72) {
  W = Math.round(W)
  H = Math.round(H)
  const px = Buffer.alloc(W * H * 3)
  const ox = (W - box) / 2
  const oy = (H - box) / 2
  const slabH = box / 3.6
  const gap = slabH * 0.18
  const depth = slabH * 0.22
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let col = BG
      BLOCKS.forEach((b, i) => {
        const w = box * (1 - i * 0.12)
        const rx = ox + (box - w) / 2
        const ry = oy + box - (i + 1) * (slabH + gap) + gap
        const r = slabH * 0.28
        if (inRoundRect(x, y, rx, ry + depth, w, slabH - depth, r)) col = b.shade
        if (inRoundRect(x, y, rx, ry, w, slabH - depth, r)) col = b.color
      })
      px.set(col, (y * W + x) * 3)
    }
  }
  const raw = Buffer.alloc(H * (W * 3 + 1))
  for (let y = 0; y < H; y++) px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const icon = (size, maskable = false) => render(size, size, size * (maskable ? 0.52 : 0.72))

writeFileSync('public/pwa-192.png', icon(192))
writeFileSync('public/pwa-512.png', icon(512))
writeFileSync('public/pwa-maskable-512.png', icon(512, true))
writeFileSync('public/apple-touch-icon.png', icon(180))

const RES = 'android/app/src/main/res'
if (existsSync(RES)) {
  const dpi = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
  for (const [d, k] of Object.entries(dpi)) {
    writeFileSync(`${RES}/mipmap-${d}/ic_launcher.png`, icon(48 * k))
    writeFileSync(`${RES}/mipmap-${d}/ic_launcher_round.png`, icon(48 * k, true))
    // Adaptive icon foreground: launchers crop to the middle ~66%, so keep the tower small.
    writeFileSync(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, render(108 * k, 108 * k, 108 * k * 0.42))
  }
  // Splash screens keep their sizes; redraw them dark with the tower in the middle.
  for (const dir of readdirSync(RES).filter((n) => n.startsWith('drawable'))) {
    const p = `${RES}/${dir}/splash.png`
    if (!existsSync(p)) continue
    const b = readFileSync(p)
    const W = b.readUInt32BE(16)
    const H = b.readUInt32BE(20)
    writeFileSync(p, render(W, H, Math.min(W, H) * 0.3))
  }
  writeFileSync(
    `${RES}/values/ic_launcher_background.xml`,
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0D0D0F</color>\n</resources>\n',
  )
}
console.log('icons written')
