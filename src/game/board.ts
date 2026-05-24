import { BRICK, CRYSTAL, EMPTY, type Cell, type StageDef } from './stages.ts'

export interface Pos { x: number; y: number }

export interface Board {
  width: number
  height: number
  cells: Cell[][]
  player: Pos
  crystals: Pos[]
  stepsMax: number
  stepsUsed: number
  status: 'playing' | 'cleared' | 'stuck'
}

export function loadStage(stage: StageDef): Board {
  const cells: Cell[][] = stage.grid.map((row) => row.slice() as Cell[])
  const crystals: Pos[] = []
  for (let y = 0; y < stage.height; y++) {
    for (let x = 0; x < stage.width; x++) {
      if (cells[y][x] === CRYSTAL) crystals.push({ x, y })
    }
  }
  return {
    width: stage.width,
    height: stage.height,
    cells,
    player: { x: 0, y: 0 },
    crystals,
    stepsMax: stage.steps,
    stepsUsed: 0,
    status: 'playing',
  }
}

const inBounds = (b: Board, x: number, y: number) =>
  x >= 0 && x < b.width && y >= 0 && y < b.height

export type StepEvent =
  | { kind: 'walked' }
  | { kind: 'pushed'; cell: Cell; from: Pos; to: Pos }
  | { kind: 'broken'; pos: Pos }
  | { kind: 'noop' }

export function step(b: Board, dx: number, dy: number): StepEvent {
  if (b.status !== 'playing') return { kind: 'noop' }
  const nx = b.player.x + dx
  const ny = b.player.y + dy
  if (!inBounds(b, nx, ny)) return { kind: 'noop' }

  const target = b.cells[ny][nx]
  if (target === EMPTY) {
    b.player.x = nx
    b.player.y = ny
    return { kind: 'walked' }
  }

  if (target === CRYSTAL) {
    const bx = nx + dx
    const by = ny + dy
    if (!inBounds(b, bx, by) || b.cells[by][bx] !== EMPTY) {
      return { kind: 'noop' }
    }
  }

  b.stepsUsed += 1
  b.cells[ny][nx] = EMPTY

  let ex = nx
  let ey = ny
  while (true) {
    const tx = ex + dx
    const ty = ey + dy
    if (!inBounds(b, tx, ty)) break
    if (b.cells[ty][tx] !== EMPTY) break
    ex = tx
    ey = ty
  }

  if (ex === nx && ey === ny) {
    return { kind: 'broken', pos: { x: nx, y: ny } }
  }

  b.cells[ey][ex] = target
  if (target === CRYSTAL) {
    const c = b.crystals.find((c) => c.x === nx && c.y === ny)
    if (c) {
      c.x = ex
      c.y = ey
    }
  }

  return { kind: 'pushed', cell: target, from: { x: nx, y: ny }, to: { x: ex, y: ey } }
}

export function checkStatus(b: Board): void {
  if (b.status !== 'playing') return
  if (checkWin(b)) {
    b.status = 'cleared'
    return
  }
  if (b.stepsUsed >= b.stepsMax) {
    b.status = 'stuck'
  }
}

export function checkWin(b: Board): boolean {
  if (b.crystals.length < 3) return false
  const [a, c, d] = b.crystals
  const lastX = b.width - 1
  const lastY = b.height - 1

  if ((a.x === 0 && c.x === 0) || (a.x === lastX && c.x === lastX)) return false
  if ((a.y === 0 && c.y === 0) || (a.y === lastY && c.y === lastY)) return false

  if (a.x === c.x && c.x === d.x) {
    const v = Math.abs((a.y - c.y) * (c.y - d.y) * (d.y - a.y))
    if (v === 2) return true
  }
  if (a.y === c.y && c.y === d.y) {
    const v = Math.abs((a.x - c.x) * (c.x - d.x) * (d.x - a.x))
    if (v === 2) return true
  }
  return false
}

export { BRICK, CRYSTAL, EMPTY }
