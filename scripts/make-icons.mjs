// Generates the PWA PNG icons (stacked tower blocks) with no image deps.
// Run: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs'
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

function render(size, maskable) {
  const px = Buffer.alloc(size * size * 3)
  const pad = maskable ? 0.24 : 0.14
  const inner = size * (1 - pad * 2)
  const slabH = inner / 3.6
  const gap = slabH * 0.18
  const depth = slabH * 0.22
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = BG
      BLOCKS.forEach((b, i) => {
        const w = inner * (1 - i * 0.12)
        const rx = (size - w) / 2
        const ry = size * pad + inner - (i + 1) * (slabH + gap) + gap
        const r = slabH * 0.28
        if (inRoundRect(x, y, rx, ry + depth, w, slabH - depth, r)) col = b.shade
        if (inRoundRect(x, y, rx, ry, w, slabH - depth, r)) col = b.color
      })
      px.set(col, (y * size + x) * 3)
    }
  }
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync('public/pwa-192.png', render(192, false))
writeFileSync('public/pwa-512.png', render(512, false))
writeFileSync('public/pwa-maskable-512.png', render(512, true))
writeFileSync('public/apple-touch-icon.png', render(180, false))
console.log('icons written')
