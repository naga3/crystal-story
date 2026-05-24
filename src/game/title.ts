import { drawText, textWidth } from './font.ts'
import { SCREEN_H, SCREEN_W } from './render.ts'

const TITLE_DATA: ReadonlyArray<readonly [number, string]> = [
  [0, '0514051400140514051405140144'],
  [0, '5234503425342234253455545544'],
  [0, '5014551405440114451450545514'],
  [0, '2534223423442534423422342534'],
  [1, '05140514051405140014'],
  [1, '22342534525450342534'],
  [1, '01144514515455140544'],
  [1, '25344234253422342344'],
]

function makeWhiteCanvas(w: number, h: number, paint: (set: (x: number, y: number) => void) => void): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const cx = c.getContext('2d')!
  const img = cx.createImageData(w, h)
  paint((x, y) => {
    const i = (y * w + x) * 4
    img.data[i + 0] = 255
    img.data[i + 1] = 255
    img.data[i + 2] = 255
    img.data[i + 3] = 255
  })
  cx.putImageData(img, 0, 0)
  return c
}

const QUARTERS: HTMLCanvasElement[] = ([[8, 8], [0, 8], [8, 0], [0, 0]] as const).map(([cx, cy]) =>
  makeWhiteCanvas(8, 8, (set) => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy <= 64) set(x, y)
      }
    }
  }),
)

const SOLID = makeWhiteCanvas(8, 8, (set) => {
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) set(x, y)
})

const titleMask: HTMLCanvasElement = (() => {
  const c = document.createElement('canvas')
  c.width = SCREEN_W
  c.height = SCREEN_H
  const cx = c.getContext('2d')!
  const bankRow = [0, 0]
  for (const [bank, data] of TITLE_DATA) {
    const j = bankRow[bank]++
    for (let k = 0; k < data.length; k++) {
      const L = Number(data[k])
      const XT = (bank * 4 + k + 2) * 8
      const YT = (bank * 8 + j + 4) * 8
      if (L === 4) continue
      if (L === 5) cx.drawImage(SOLID, XT, YT)
      else cx.drawImage(QUARTERS[L], XT, YT)
    }
  }
  return c
})()

const tintCanvas = document.createElement('canvas')
tintCanvas.width = SCREEN_W
tintCanvas.height = SCREEN_H
const tintCtx = tintCanvas.getContext('2d')!

const FADE_MS = 1500
const RAND_PERIOD_MS = 200

function rgb3to8(v: number): number {
  return Math.round((v * 255) / 7)
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function renderTitle(ctx: CanvasRenderingContext2D, now: number): void {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  let r: number, g: number, b: number
  if (now < FADE_MS) {
    const v = Math.min(7, Math.floor((now / FADE_MS) * 8))
    r = g = b = rgb3to8(v)
  } else {
    const seed = Math.floor((now - FADE_MS) / RAND_PERIOD_MS)
    r = rgb3to8(Math.floor(pseudoRandom(seed) * 8))
    g = rgb3to8(Math.floor(pseudoRandom(seed + 101) * 8))
    b = rgb3to8(Math.floor(pseudoRandom(seed + 211) * 8))
  }

  tintCtx.clearRect(0, 0, SCREEN_W, SCREEN_H)
  tintCtx.drawImage(titleMask, 0, 0)
  tintCtx.globalCompositeOperation = 'source-in'
  tintCtx.fillStyle = `rgb(${r}, ${g}, ${b})`
  tintCtx.fillRect(0, 0, SCREEN_W, SCREEN_H)
  tintCtx.globalCompositeOperation = 'source-over'
  ctx.drawImage(tintCanvas, 0, 0)

  const labels = ['ORIGINAL', 'ARRANGE'] as const
  const baseY = SCREEN_H - 56
  for (let i = 0; i < labels.length; i++) {
    const sel = i === selectionIndex
    const label = labels[i]
    const x = Math.floor((SCREEN_W - textWidth(label)) / 2)
    const y = baseY + i * 12
    if (sel) {
      drawText(ctx, '>', x - 12, y, '#fff')
      drawText(ctx, '<', x + textWidth(label) + 4, y, '#fff')
    }
    drawText(ctx, label, x, y, sel ? '#fff' : '#888')
  }
  const enter = 'ENTER: START'
  drawText(ctx, enter, Math.floor((SCREEN_W - textWidth(enter)) / 2), SCREEN_H - 28, '#aaa')
  if (Math.floor(now / 600) % 2 === 0) {
    const cont = 'C: CONTINUE'
    drawText(ctx, cont, Math.floor((SCREEN_W - textWidth(cont)) / 2), SCREEN_H - 14, '#888')
  }
}

let selectionIndex = 0

export function getSelectedModeIndex(): number {
  return selectionIndex
}

export function setSelectedModeIndex(i: number): void {
  selectionIndex = (i + 2) % 2
}
