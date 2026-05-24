import { BRICK, CRYSTAL, EMPTY, type Board } from './board.ts'
import { BRICK_DATA, CRYSTAL_DATA, PLAYER_DATA, spriteToCanvas, TILE_SIZE } from './chr.ts'

export const TILE = TILE_SIZE
export const SCREEN_W = 256
export const SCREEN_H = 212
const BOARD_OFFSET_X = 8
const BOARD_OFFSET_Y = 8

const CRYSTAL_SPRITE = spriteToCanvas(CRYSTAL_DATA)
const BRICK_SPRITE = spriteToCanvas(BRICK_DATA)
const PLAYER_SPRITE = spriteToCanvas(PLAYER_DATA)

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
      const cell = board.cells[y][x]
      if (cell === EMPTY) continue
      const sprite = cell === BRICK ? BRICK_SPRITE : cell === CRYSTAL ? CRYSTAL_SPRITE : null
      if (sprite) {
        ctx.drawImage(sprite, BOARD_OFFSET_X + x * TILE, BOARD_OFFSET_Y + y * TILE)
      }
    }
  }
  ctx.drawImage(PLAYER_SPRITE, BOARD_OFFSET_X + board.player.x * TILE, BOARD_OFFSET_Y + board.player.y * TILE)

  drawStatus(ctx, board, round)
}

function drawStatus(ctx: CanvasRenderingContext2D, board: Board, round: number): void {
  const stepsLeft = Math.max(0, board.stepsMax - board.stepsUsed)
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
