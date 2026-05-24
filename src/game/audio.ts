let ctx: AudioContext | null = null

export function ensureAudio(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function noteAt(c: AudioContext, t: number, freq: number, durSec: number, vol = 0.08): void {
  const osc = c.createOscillator()
  osc.type = 'square'
  osc.frequency.value = freq
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durSec)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + durSec + 0.02)
}

export function playGiveUp(): void {
  const c = ensureAudio()
  let t = c.currentTime
  for (let n = 80; n >= 20; n -= 5) {
    noteAt(c, t, midiToFreq(n), 0.04)
    t += 0.03
  }
}

export function playBreak(): void {
  const c = ensureAudio()
  let t = c.currentTime
  for (let i = 0; i < 8; i++) {
    const n = 80 - i * 10
    noteAt(c, t, midiToFreq(n), 0.025, 0.1)
    t += 0.03
  }
}

export function playClear(): void {
  const c = ensureAudio()
  const seq: ReadonlyArray<readonly [number, number]> = [
    [74, 250], [76, 125], [76, 125], [74, 250], [72, 250],
    [74, 250], [76, 125], [76, 125], [84, 500],
  ]
  let t = c.currentTime
  for (const [midi, ms] of seq) {
    noteAt(c, t, midiToFreq(midi), (ms / 1000) * 0.9, 0.07)
    t += ms / 1000
  }
}
