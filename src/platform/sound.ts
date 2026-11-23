// Tiny synthesized UI sounds (Web Audio, no files). Works the same in the Capacitor WebView.
let ctx: AudioContext | undefined
let enabled = true

export const setSoundEnabled = (on: boolean) => {
  enabled = on
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.12, slideTo?: number, delay = 0) {
  if (!enabled || typeof AudioContext === 'undefined') return
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()
  const t = ctx.currentTime + delay
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(ctx.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export const sound = {
  tick: () => tone(2200, 0.025, 'square', 0.025),
  tap: () => tone(520, 0.07, 'triangle', 0.09, 780),
  done: () => {
    tone(660, 0.09, 'triangle', 0.12)
    tone(990, 0.16, 'triangle', 0.12, undefined, 0.08)
  },
  slam: () => {
    tone(140, 0.28, 'sine', 0.4, 40)
    tone(90, 0.18, 'triangle', 0.2, 50, 0.02)
  },
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.4 : 0.16, 'triangle', 0.12, undefined, i * 0.1)),
  crack: () => tone(320, 0.22, 'sawtooth', 0.06, 70),
  shutter: () => {
    tone(1800, 0.03, 'square', 0.06)
    tone(900, 0.05, 'square', 0.05, undefined, 0.05)
  },
}
