import { BRICK, CRYSTAL, EMPTY, type Board } from './board.ts'
import { BRICK_DATA, CRYSTAL_DATA, PLAYER_DATA, spriteToCanvas, TILE_SIZE } from './chr.ts'
import { drawText, textWidth } from './font.ts'

export const TILE = TILE_SIZE
export const SCREEN_W = 256
export const SCREEN_H = 212
const BOARD_OFFSET_X = 8
const BOARD_OFFSET_Y = 8

const CRYSTAL_SPRITE = spriteToCanvas(CRYSTAL_DATA)
const BRICK_SPRITE = spriteToCanvas(BRICK_DATA)
const PLAYER_SPRITE = spriteToCanvas(PLAYER_DATA)

export type Animation =
  | { kind: 'slide'; cell: 1 | 2; from: Pos; to: Pos; start: number; duration: number }
  | { kind: 'break'; pos: Pos; start: number; duration: number }

interface Pos {
  x: number
  y: number
}

export function render(
  ctx: CanvasRenderingContext2D,
  board: Board,
  round: number,
  animations: Animation[],
  now: number,
): void {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  const innerW = board.width * TILE
  const innerH = board.height * TILE
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.strokeRect(BOARD_OFFSET_X - 0.5, BOARD_OFFSET_Y - 0.5, innerW + 1, innerH + 1)

  const masked = new Set<number>()
  for (const a of animations) {
    if (a.kind === 'slide') masked.add(a.to.y * board.width + a.to.x)
  }

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      if (masked.has(y * board.width + x)) continue
      const cell = board.cells[y][x]
      if (cell === EMPTY) continue
      const sprite = cell === BRICK ? BRICK_SPRITE : cell === CRYSTAL ? CRYSTAL_SPRITE : null
      if (sprite) ctx.drawImage(sprite, BOARD_OFFSET_X + x * TILE, BOARD_OFFSET_Y + y * TILE)
    }
  }

  for (const a of animations) {
    if (a.kind === 'slide') drawSlide(ctx, a, now)
    else if (a.kind === 'break') drawBreak(ctx, a, now)
  }

  ctx.drawImage(
    PLAYER_SPRITE,
    BOARD_OFFSET_X + board.player.x * TILE,
    BOARD_OFFSET_Y + board.player.y * TILE,
  )

  drawStatus(ctx, board, round)
}

function drawSlide(ctx: CanvasRenderingContext2D, a: Animation & { kind: 'slide' }, now: number): void {
  const t = Math.min(1, (now - a.start) / a.duration)
  const ix = a.from.x + (a.to.x - a.from.x) * t
  const iy = a.from.y + (a.to.y - a.from.y) * t
  const px = Math.round(BOARD_OFFSET_X + ix * TILE)
  const py = Math.round(BOARD_OFFSET_Y + iy * TILE)
  ctx.drawImage(a.cell === BRICK ? BRICK_SPRITE : CRYSTAL_SPRITE, px, py)
}

function drawBreak(ctx: CanvasRenderingContext2D, a: Animation & { kind: 'break' }, now: number): void {
  const px = BOARD_OFFSET_X + a.pos.x * TILE
  const py = BOARD_OFFSET_Y + a.pos.y * TILE
  ctx.drawImage(BRICK_SPRITE, px, py)
  const t = Math.min(1, (now - a.start) / a.duration)
  const steps = Math.floor(t * 8)
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  for (let i = 0; i <= steps; i++) {
    if (i >= 8) break
    ctx.strokeRect(px + i + 0.5, py + i + 0.5, TILE - 1 - i * 2, TILE - 1 - i * 2)
  }
}

function drawStatus(ctx: CanvasRenderingContext2D, board: Board, round: number): void {
  const stepsLeft = Math.max(0, board.stepsMax - board.stepsUsed)
  const baseY = BOARD_OFFSET_Y + board.height * TILE + 4
  drawText(ctx, `STEP ${stepsLeft}  ROUND ${round}`, BOARD_OFFSET_X, baseY, '#fff')

  if (board.status === 'cleared') {
    overlay(ctx, board, 'CLEAR! (ENTER)')
  } else if (board.status === 'stuck') {
    overlay(ctx, board, 'STUCK (R:RETRY G:TITLE)')
  }
}

function overlay(ctx: CanvasRenderingContext2D, board: Board, msg: string): void {
  const innerW = board.width * TILE
  const innerH = board.height * TILE
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, innerW, innerH)
  const tw = textWidth(msg)
  drawText(
    ctx,
    msg,
    BOARD_OFFSET_X + Math.floor((innerW - tw) / 2),
    BOARD_OFFSET_Y + Math.floor(innerH / 2) - 4,
    '#fff',
  )
}
