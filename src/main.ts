import { ensureAudio, playBreak, playClear, playGiveUp } from './game/audio.ts'
import { checkStatus, loadStage, step, type Board } from './game/board.ts'
import { bindKeyboard, DIR_VECTORS, type Action, type Direction } from './game/input.ts'
import { type Animation, render, SCREEN_H, SCREEN_W } from './game/render.ts'
import { STAGES } from './game/stages.ts'

const SLIDE_MS_PER_CELL = 60
const BREAK_MS = 240

const canvas = document.getElementById('screen') as HTMLCanvasElement
canvas.width = SCREEN_W
canvas.height = SCREEN_H
const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

let roundIdx = 0
let board: Board = loadStage(STAGES[roundIdx])
const animations: Animation[] = []
let pendingStatus = false

function newStage(idx: number): void {
  roundIdx = idx
  board = loadStage(STAGES[roundIdx])
  animations.length = 0
  pendingStatus = false
}

function onMove(dir: Direction): void {
  ensureAudio()
  if (animations.length > 0) return
  if (board.status !== 'playing') return

  const [dx, dy] = DIR_VECTORS[dir]
  const event = step(board, dx, dy)
  const now = performance.now()

  if (event.kind === 'pushed') {
    const distance = Math.max(
      Math.abs(event.to.x - event.from.x),
      Math.abs(event.to.y - event.from.y),
    )
    animations.push({
      kind: 'slide',
      cell: event.cell as 1 | 2,
      from: event.from,
      to: event.to,
      start: now,
      duration: SLIDE_MS_PER_CELL * distance,
    })
    pendingStatus = true
  } else if (event.kind === 'broken') {
    animations.push({
      kind: 'break',
      pos: event.pos,
      start: now,
      duration: BREAK_MS,
    })
    playBreak()
    pendingStatus = true
  }
}

function onAction(action: Action): void {
  ensureAudio()
  if (animations.length > 0) return
  if (action === 'next' && board.status === 'cleared') {
    newStage((roundIdx + 1) % STAGES.length)
    return
  }
  if (action === 'restart') {
    newStage(roundIdx)
    return
  }
  if (action === 'giveup') {
    playGiveUp()
    newStage(0)
  }
}

bindKeyboard({ onMove, onAction })

function tick(now: number): void {
  for (let i = animations.length - 1; i >= 0; i--) {
    if (now - animations[i].start >= animations[i].duration) {
      animations.splice(i, 1)
    }
  }
  if (animations.length === 0 && pendingStatus) {
    const prevStatus = board.status
    checkStatus(board)
    pendingStatus = false
    if (prevStatus === 'playing' && board.status === 'cleared') playClear()
  }
  render(ctx, board, roundIdx + 1, animations, now)
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
