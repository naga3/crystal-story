const AUDIO_BASE = `${import.meta.env.BASE_URL}audio/`

const SFX_FILES = {
  slide: 'sfx/thrusterFire_000.ogg',
  break: 'sfx/explosionCrunch_002.ogg',
  clear: 'sfx/forceField_002.ogg',
  giveup: 'sfx/lowFrequency_explosion_000.ogg',
} as const

export type ArrangeSfx = keyof typeof SFX_FILES

let ctx: AudioContext | null = null
const sfxBuffers = new Map<ArrangeSfx, AudioBuffer>()
let bgm: HTMLAudioElement | null = null
let loadPromise: Promise<void> | null = null

export function loadArrangeAudio(): Promise<void> {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    if (!ctx) ctx = new AudioContext()
    await Promise.all(
      (Object.entries(SFX_FILES) as Array<[ArrangeSfx, string]>).map(async ([name, path]) => {
        const res = await fetch(AUDIO_BASE + path)
        const ab = await res.arrayBuffer()
        const buf = await ctx!.decodeAudioData(ab)
        sfxBuffers.set(name, buf)
      }),
    )
    bgm = new Audio(`${AUDIO_BASE}bgm.ogg`)
    bgm.loop = true
    bgm.volume = 0.4
    bgm.preload = 'auto'
  })()
  return loadPromise
}

export function resumeArrangeAudio(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume()
}

export function playArrangeSfx(name: ArrangeSfx, opts: { volume?: number; durationMs?: number } = {}): void {
  if (!ctx) return
  const buf = sfxBuffers.get(name)
  if (!buf) return
  resumeArrangeAudio()
  const volume = opts.volume ?? 0.55
  const src = ctx.createBufferSource()
  src.buffer = buf
  const gain = ctx.createGain()
  gain.gain.value = volume
  src.connect(gain).connect(ctx.destination)
  const t0 = ctx.currentTime
  src.start(t0)
  if (opts.durationMs !== undefined) {
    const endAt = t0 + opts.durationMs / 1000
    const fadeStart = Math.max(t0, endAt - 0.06)
    gain.gain.setValueAtTime(volume, fadeStart)
    gain.gain.linearRampToValueAtTime(0, endAt)
    src.stop(endAt + 0.02)
  }
}

export function startArrangeBgm(): void {
  if (!bgm) return
  if (!bgm.paused) return
  bgm.play().catch((e: unknown) => console.warn('bgm play failed:', e))
}

export function stopArrangeBgm(): void {
  if (!bgm) return
  bgm.pause()
  bgm.currentTime = 0
}
