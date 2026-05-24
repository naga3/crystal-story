import {
  arrangeOnBreak,
  arrangeOnClear,
  arrangeOnMove,
  arrangeOnSlideEnd,
  arrangeReset,
  loadArrangeSprites,
  renderArrange,
} from './game/arrange.ts'
import {
  loadArrangeAudio,
  playArrangeSfx,
  resumeArrangeAudio,
  startArrangeBgm,
  stopArrangeBgm,
} from './game/arrangeAudio.ts'
import { ensureAudio, playBreak, playClear, playGiveUp } from './game/audio.ts'
import { checkStatus, loadStage, step, type Board } from './game/board.ts'
import { bindKeyboard, DIR_VECTORS, type Action, type Direction } from './game/input.ts'
import { type Animation, render, SCREEN_H, SCREEN_W, TILE } from './game/render.ts'
import { STAGES } from './game/stages.ts'
import { hideHelp, isHelpVisible, showHelp } from './game/help.ts'
import { getSelectedModeIndex, MENU_LABELS, renderTitle, setSelectedModeIndex } from './game/title.ts'
import { setupTouchUI } from './game/touch.ts'

const SLIDE_MS_PER_CELL = 60
const BREAK_MS = 240

type Mode = 'title' | 'playing'
type Variant = 'original' | 'arrange'

const canvas = document.getElementById('screen') as HTMLCanvasElement
canvas.width = SCREEN_W
canvas.height = SCREEN_H
const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

void loadArrangeSprites().catch((e: unknown) => console.error('arrange sprites failed:', e))
void loadArrangeAudio().catch((e: unknown) => console.error('arrange audio failed:', e))

let mode: Mode = 'title'
let variant: Variant = 'original'
let titleStart = performance.now()

let roundIdx = 0
let board: Board = loadStage(STAGES[roundIdx])
const animations: Animation[] = []
let pendingStatus = false

function startStage(idx: number, v: Variant): void {
  roundIdx = idx
  variant = v
  board = loadStage(STAGES[roundIdx])
  animations.length = 0
  pendingStatus = false
  mode = 'playing'
  arrangeReset()
  if (v === 'arrange') startArrangeBgm()
  else stopArrangeBgm()
}

function toTitle(): void {
  mode = 'title'
  titleStart = performance.now()
  arrangeReset()
  stopArrangeBgm()
}

function onMove(dir: Direction): void {
  if (isHelpVisible()) return
  ensureAudio()
  resumeArrangeAudio()
  if (mode === 'title') {
    if (dir === 'up') setSelectedModeIndex(getSelectedModeIndex() - 1)
    else if (dir === 'down') setSelectedModeIndex(getSelectedModeIndex() + 1)
    return
  }
  if (animations.length > 0) return
  if (board.status !== 'playing') return

  if (variant === 'arrange') arrangeOnMove(dir)
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
    if (variant === 'arrange') playArrangeSfx('slide', { durationMs: SLIDE_MS_PER_CELL * distance + 40 })
    pendingStatus = true
  } else if (event.kind === 'broken') {
    animations.push({
      kind: 'break',
      pos: event.pos,
      start: now,
      duration: BREAK_MS,
    })
    if (variant === 'arrange') {
      playArrangeSfx('break')
      const ox = Math.floor((SCREEN_W - board.width * TILE) / 2)
      const oy = Math.floor((SCREEN_H - board.height * TILE) / 2) - 4
      arrangeOnBreak(event.pos.x, event.pos.y, ox, oy)
    } else {
      playBreak()
    }
    pendingStatus = true
  }
}

function onAction(action: Action): void {
  if (isHelpVisible()) {
    if (action === 'next' || action === 'giveup') hideHelp()
    return
  }
  ensureAudio()
  resumeArrangeAudio()
  if (mode === 'title') {
    const selected = MENU_LABELS[getSelectedModeIndex()]
    if (selected === 'HOW TO PLAY') {
      if (action === 'next') showHelp()
      return
    }
    const v: Variant = selected === 'ORIGINAL' ? 'original' : 'arrange'
    if (action === 'continue') startStage(roundIdx, v)
    else startStage(0, v)
    return
  }
  if (animations.length > 0) return
  if (action === 'next' && board.status === 'cleared') {
    const next = roundIdx + 1
    if (next >= STAGES.length) toTitle()
    else startStage(next, variant)
    return
  }
  if (action === 'restart') {
    startStage(roundIdx, variant)
    return
  }
  if (action === 'giveup') {
    if (variant === 'arrange') playArrangeSfx('giveup')
    else playGiveUp()
    toTitle()
  }
}

bindKeyboard({ onMove, onAction })
setupTouchUI({ onMove, onAction })

function tick(now: number): void {
  if (mode === 'title') {
    renderTitle(ctx, now - titleStart)
    requestAnimationFrame(tick)
    return
  }
  for (let i = animations.length - 1; i >= 0; i--) {
    if (now - animations[i].start >= animations[i].duration) {
      const ended = animations[i]
      animations.splice(i, 1)
      if (variant === 'arrange' && ended.kind === 'slide') arrangeOnSlideEnd()
    }
  }
  if (animations.length === 0 && pendingStatus) {
    const prev = board.status
    checkStatus(board)
    pendingStatus = false
    if (prev === 'playing' && board.status === 'cleared') {
      if (variant === 'arrange') {
        playArrangeSfx('clear')
        arrangeOnClear()
      } else {
        playClear()
      }
    }
  }
  if (variant === 'arrange') renderArrange(ctx, board, roundIdx + 1, animations, now)
  else render(ctx, board, roundIdx + 1, animations, now)
  requestAnimationFrame(tick)
}
requestAnimationFrame(tick)
