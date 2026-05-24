export type Direction = 'up' | 'down' | 'left' | 'right'
export type Action = 'giveup' | 'restart' | 'next'

export interface InputHandlers {
  onMove(dir: Direction): void
  onAction(action: Action): void
}

const DIR_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
}

export function bindKeyboard(handlers: InputHandlers): () => void {
  const onKey = (ev: KeyboardEvent) => {
    if (ev.repeat) return
    const dir = DIR_KEYS[ev.key]
    if (dir) {
      ev.preventDefault()
      handlers.onMove(dir)
      return
    }
    if (ev.key === 'g' || ev.key === 'G') {
      handlers.onAction('giveup')
      return
    }
    if (ev.key === 'r' || ev.key === 'R') {
      handlers.onAction('restart')
      return
    }
    if (ev.key === 'Enter' || ev.key === ' ') {
      handlers.onAction('next')
    }
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}

export const DIR_VECTORS: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}
