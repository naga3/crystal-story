import { loadStage, step, type Board } from './game/board.ts'
import { bindKeyboard, DIR_VECTORS, type Action, type Direction } from './game/input.ts'
import { render, SCREEN_H, SCREEN_W } from './game/render.ts'
import { STAGES } from './game/stages.ts'

const canvas = document.getElementById('screen') as HTMLCanvasElement
canvas.width = SCREEN_W
canvas.height = SCREEN_H
const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

let roundIdx = 0
let board: Board = loadStage(STAGES[roundIdx])
let dirty = true

function newStage(idx: number): void {
  roundIdx = idx
  board = loadStage(STAGES[roundIdx])
  dirty = true
}

function onMove(dir: Direction): void {
  if (board.status !== 'playing') return
  const [dx, dy] = DIR_VECTORS[dir]
  step(board, dx, dy)
  dirty = true
}

function onAction(action: Action): void {
  if (action === 'next' && board.status === 'cleared') {
    newStage((roundIdx + 1) % STAGES.length)
    return
  }
  if (action === 'restart') {
    newStage(roundIdx)
    return
  }
  if (action === 'giveup') {
    newStage(0)
  }
}

bindKeyboard({ onMove, onAction })

function frame(): void {
  if (dirty) {
    render(ctx, board, roundIdx + 1)
    dirty = false
  }
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
