import { BRICK, CRYSTAL, EMPTY, type Board } from './board.ts'
import { drawText, textWidth } from './font.ts'
import { type Animation, SCREEN_H, SCREEN_W, TILE } from './render.ts'

const SPRITE_BASE = `${import.meta.env.BASE_URL}sprites/frames/`

interface Sprites {
  playerIdle: HTMLImageElement[]
  playerRun: HTMLImageElement[]
  crystal: HTMLImageElement[]
  brick: HTMLImageElement
  floors: HTMLImageElement[]
}

let sprites: Sprites | null = null
let loadPromise: Promise<Sprites> | null = null

function loadImage(name: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load: ${name}`))
    img.src = `${SPRITE_BASE}${name}.png`
  })
}

export function loadArrangeSprites(): Promise<Sprites> {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    const [playerIdle, playerRun, crystal, brick, floors] = await Promise.all([
      Promise.all([0, 1, 2, 3].map((i) => loadImage(`wizzard_m_idle_anim_f${i}`))),
      Promise.all([0, 1, 2, 3].map((i) => loadImage(`wizzard_m_run_anim_f${i}`))),
      Promise.all([0, 1, 2].map((i) => loadImage(`chest_full_open_anim_f${i}`))),
      loadImage('button_blue_up'),
      Promise.all([1, 2, 3, 4, 5, 6, 7, 8].map((i) => loadImage(`floor_${i}`))),
    ])
    sprites = { playerIdle, playerRun, crystal, brick, floors }
    return sprites
  })()
  return loadPromise
}

export function arrangeReady(): boolean {
  return sprites !== null
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number
  color: string
  gravity: number
}

const particles: Particle[] = []
let lastTick = 0
let shakeAmp = 0
let shakeUntil = 0
let facingLeft = false
let lastMoveAt = 0
const RUN_HOLD_MS = 220

export function arrangeOnMove(dir: 'up' | 'down' | 'left' | 'right'): void {
  if (dir === 'left') facingLeft = true
  else if (dir === 'right') facingLeft = false
  lastMoveAt = performance.now()
}

export function arrangeOnBreak(gx: number, gy: number, ox: number, oy: number): void {
  const cx = ox + gx * TILE + TILE / 2
  const cy = oy + gy * TILE + TILE / 2
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4
    const speed = 40 + Math.random() * 60
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      age: 0,
      life: 0.5 + Math.random() * 0.4,
      size: 1 + Math.floor(Math.random() * 3),
      color: ['#5fb6f5', '#3a8ac2', '#82c8ff', '#2e6b9a'][Math.floor(Math.random() * 4)],
      gravity: 240,
    })
  }
  shakeAmp = 3
  shakeUntil = performance.now() + 220
}

export function arrangeOnSlideEnd(): void {
  shakeAmp = Math.max(shakeAmp, 1.5)
  shakeUntil = Math.max(shakeUntil, performance.now() + 90)
}

export function arrangeOnClear(): void {
  // no visual effect on alignment
}

export function arrangeReset(): void {
  particles.length = 0
  shakeAmp = 0
  shakeUntil = 0
  facingLeft = false
  lastMoveAt = 0
}

function boardOffsetX(b: Board): number {
  return Math.floor((SCREEN_W - b.width * TILE) / 2)
}

function boardOffsetY(b: Board): number {
  const HEAD_ROOM = 12
  const STATUS_ROOM = 10
  const maxY = SCREEN_H - STATUS_ROOM - b.height * TILE
  if (maxY < HEAD_ROOM) return Math.max(0, maxY)
  return Math.floor((HEAD_ROOM + maxY) / 2)
}

export function renderArrange(
  ctx: CanvasRenderingContext2D,
  board: Board,
  round: number,
  animations: Animation[],
  now: number,
): void {
  if (!sprites) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)
    const msg = 'LOADING...'
    drawText(ctx, msg, Math.floor((SCREEN_W - textWidth(msg)) / 2), Math.floor(SCREEN_H / 2) - 4, '#888')
    return
  }

  const dt = lastTick === 0 ? 0 : Math.min(0.05, (now - lastTick) / 1000)
  lastTick = now

  let shakeX = 0
  let shakeY = 0
  if (now < shakeUntil) {
    const remain = (shakeUntil - now) / 400
    const a = shakeAmp * Math.min(1, remain)
    shakeX = (Math.random() - 0.5) * a * 2
    shakeY = (Math.random() - 0.5) * a * 2
  }

  ctx.save()
  ctx.translate(Math.round(shakeX), Math.round(shakeY))

  const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H)
  bg.addColorStop(0, '#1a0828')
  bg.addColorStop(0.6, '#0a0418')
  bg.addColorStop(1, '#02000a')
  ctx.fillStyle = bg
  ctx.fillRect(-8, -8, SCREEN_W + 16, SCREEN_H + 16)

  const ox = boardOffsetX(board)
  const oy = boardOffsetY(board)

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const seed = (x * 73 + y * 131 + board.width * 7) % sprites.floors.length
      ctx.drawImage(sprites.floors[seed], ox + x * TILE, oy + y * TILE)
    }
  }

  const masked = new Set<number>()
  for (const a of animations) {
    if (a.kind === 'slide') masked.add(a.to.y * board.width + a.to.x)
  }

  const chestSeq = [0, 1, 2, 1] as const
  const crystalFrame = chestSeq[Math.floor(now / 280) % chestSeq.length]

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      if (masked.has(y * board.width + x)) continue
      const cell = board.cells[y][x]
      if (cell === EMPTY) continue
      const px = ox + x * TILE
      const py = oy + y * TILE
      if (cell === BRICK) ctx.drawImage(sprites.brick, px, py)
      else if (cell === CRYSTAL) drawCrystal(ctx, sprites.crystal[crystalFrame], px, py, now)
    }
  }

  for (const a of animations) {
    if (a.kind === 'slide') {
      const t = Math.min(1, (now - a.start) / a.duration)
      const ix = a.from.x + (a.to.x - a.from.x) * t
      const iy = a.from.y + (a.to.y - a.from.y) * t
      const px = Math.round(ox + ix * TILE)
      const py = Math.round(oy + iy * TILE)
      if (a.cell === BRICK) ctx.drawImage(sprites.brick, px, py)
      else drawCrystal(ctx, sprites.crystal[crystalFrame], px, py, now)
    } else if (a.kind === 'break') {
      const t = Math.min(1, (now - a.start) / a.duration)
      const px = ox + a.pos.x * TILE
      const py = oy + a.pos.y * TILE
      ctx.save()
      ctx.globalAlpha = 1 - t
      ctx.drawImage(sprites.brick, px, py)
      ctx.restore()
    }
  }

  const isRunning = now - lastMoveAt < RUN_HOLD_MS
  const frames = isRunning ? sprites.playerRun : sprites.playerIdle
  const playerFrame = Math.floor(now / (isRunning ? 80 : 220)) % 4
  const psprite = frames[playerFrame]
  const ppx = ox + board.player.x * TILE + Math.floor((TILE - psprite.width) / 2)
  const ppy = oy + board.player.y * TILE + (TILE - psprite.height)
  if (facingLeft) {
    ctx.save()
    ctx.translate(ppx + psprite.width, ppy)
    ctx.scale(-1, 1)
    ctx.drawImage(psprite, 0, 0)
    ctx.restore()
  } else {
    ctx.drawImage(psprite, ppx, ppy)
  }

  updateAndDrawParticles(ctx, dt)

  ctx.restore()

  const stepsLeft = Math.max(0, board.stepsMax - board.stepsUsed)
  const statusText = `STEP ${stepsLeft}  ROUND ${round}`
  drawText(ctx, statusText, 8, SCREEN_H - 10, '#fff')

  if (board.status === 'cleared') {
    overlayText(ctx, 'CLEAR! (ENTER)')
  } else if (board.status === 'stuck') {
    overlayText(ctx, 'STUCK (R:RETRY G:TITLE)')
  }
}

function drawCrystal(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement, px: number, py: number, now: number): void {
  const cx = px + TILE / 2
  const cy = py + TILE / 2
  const pulse = 0.85 + Math.sin(now / 280 + px * 0.05) * 0.15
  const glowR = 16 * pulse
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const grad = ctx.createRadialGradient(cx, cy + 2, 0, cx, cy + 2, glowR)
  grad.addColorStop(0, 'rgba(255, 230, 110, 0.55)')
  grad.addColorStop(0.5, 'rgba(255, 180, 40, 0.2)')
  grad.addColorStop(1, 'rgba(255, 140, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(cx - glowR, cy + 2 - glowR, glowR * 2, glowR * 2)
  ctx.restore()
  ctx.drawImage(sprite, Math.round(cx - sprite.width / 2), Math.round(cy - sprite.height / 2))
}

function updateAndDrawParticles(ctx: CanvasRenderingContext2D, dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.age += dt
    if (p.age >= p.life) {
      particles.splice(i, 1)
      continue
    }
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += p.gravity * dt
    const alpha = 1 - p.age / p.life
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
  }
  ctx.globalAlpha = 1
}

function overlayText(ctx: CanvasRenderingContext2D, msg: string): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
  ctx.fillRect(0, SCREEN_H / 2 - 16, SCREEN_W, 24)
  drawText(ctx, msg, Math.floor((SCREEN_W - textWidth(msg)) / 2), Math.floor(SCREEN_H / 2) - 8, '#fff')
}
