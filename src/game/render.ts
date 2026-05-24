import { BRICK, CRYSTAL, EMPTY, type Board } from './board.ts'

export const TILE = 16
export const SCREEN_W = 256
export const SCREEN_H = 212
const BOARD_OFFSET_X = 8
const BOARD_OFFSET_Y = 8

export function render(ctx: CanvasRenderingContext2D, board: Board, round: number): void {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H)

  const innerW = board.width * TILE
  const innerH = board.height * TILE
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  ctx.strokeRect(BOARD_OFFSET_X - 0.5, BOARD_OFFSET_Y - 0.5, innerW + 1, innerH + 1)

  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      drawCell(ctx, x, y, board.cells[y][x])
    }
  }
  drawPlayer(ctx, board.player.x, board.player.y)

  const stepsLeft = Math.max(0, board.stepsMax - board.stepsUsed)
  drawStatus(ctx, board, round, stepsLeft)
}

function drawCell(ctx: CanvasRenderingContext2D, gx: number, gy: number, cell: number): void {
  if (cell === EMPTY) return
  const px = BOARD_OFFSET_X + gx * TILE
  const py = BOARD_OFFSET_Y + gy * TILE
  if (cell === BRICK) drawBrick(ctx, px, py)
  else if (cell === CRYSTAL) drawCrystal(ctx, px, py)
}

function drawBrick(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.fillStyle = '#888'
  ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2)
  ctx.fillStyle = '#aaa'
  ctx.fillRect(px + 2, py + 2, TILE - 4, 2)
  ctx.fillRect(px + 2, py + 2, 2, TILE - 4)
  ctx.fillStyle = '#555'
  ctx.fillRect(px + 2, py + TILE - 4, TILE - 4, 2)
  ctx.fillRect(px + TILE - 4, py + 2, 2, TILE - 4)
}

function drawCrystal(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  const cx = px + TILE / 2
  const cy = py + TILE / 2
  ctx.fillStyle = '#3df';
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(cx - 2, cy - 2, 1.5, 0, Math.PI * 2)
  ctx.fill()
}

function drawPlayer(ctx: CanvasRenderingContext2D, gx: number, gy: number): void {
  const cx = BOARD_OFFSET_X + gx * TILE + TILE / 2
  const cy = BOARD_OFFSET_Y + gy * TILE + TILE / 2
  ctx.fillStyle = '#fc4'
  ctx.beginPath()
  ctx.arc(cx, cy, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#082'
  ctx.fillRect(cx - 1, cy - 8, 2, 3)
}

function drawStatus(ctx: CanvasRenderingContext2D, board: Board, round: number, stepsLeft: number): void {
  ctx.fillStyle = '#fff'
  ctx.font = '8px monospace'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  const baseY = BOARD_OFFSET_Y + board.height * TILE + 4
  ctx.fillText(`STEP ${stepsLeft}  ROUND ${round}`, BOARD_OFFSET_X, baseY)

  if (board.status === 'cleared') {
    overlay(ctx, board, 'CLEAR!  (Enter)')
  } else if (board.status === 'stuck') {
    overlay(ctx, board, 'STUCK  (R: retry, G: title)')
  }
}

function overlay(ctx: CanvasRenderingContext2D, board: Board, msg: string): void {
  const innerW = board.width * TILE
  const innerH = board.height * TILE
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(BOARD_OFFSET_X, BOARD_OFFSET_Y, innerW, innerH)
  ctx.fillStyle = '#fff'
  ctx.font = '8px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(msg, BOARD_OFFSET_X + innerW / 2, BOARD_OFFSET_Y + innerH / 2)
}
