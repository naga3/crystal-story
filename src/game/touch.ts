import type { Action, Direction, InputHandlers } from './input.ts'

const DPAD: ReadonlyArray<readonly [Direction, string, string]> = [
  ['up', 'btn-up', '▲'],
  ['left', 'btn-left', '◀'],
  ['right', 'btn-right', '▶'],
  ['down', 'btn-down', '▼'],
]

const ACTIONS: ReadonlyArray<readonly [Action, string, string]> = [
  ['next', 'btn-next', 'Enter'],
  ['restart', 'btn-restart', 'R'],
  ['giveup', 'btn-giveup', 'G'],
]

export function setupTouchUI(handlers: InputHandlers): void {
  const root = document.createElement('div')
  root.id = 'touch'
  const dpad = document.createElement('div')
  dpad.id = 'dpad'
  const actions = document.createElement('div')
  actions.id = 'actions'
  root.appendChild(dpad)
  root.appendChild(actions)
  document.body.appendChild(root)

  for (const [dir, id, label] of DPAD) {
    const b = document.createElement('button')
    b.id = id
    b.className = 'dir'
    b.textContent = label
    b.addEventListener('touchstart', (ev) => {
      ev.preventDefault()
      handlers.onMove(dir)
    }, { passive: false })
    b.addEventListener('mousedown', (ev) => {
      ev.preventDefault()
      handlers.onMove(dir)
    })
    dpad.appendChild(b)
  }

  for (const [action, id, label] of ACTIONS) {
    const b = document.createElement('button')
    b.id = id
    b.className = 'act'
    b.textContent = label
    b.addEventListener('touchstart', (ev) => {
      ev.preventDefault()
      handlers.onAction(action)
    }, { passive: false })
    b.addEventListener('mousedown', (ev) => {
      ev.preventDefault()
      handlers.onAction(action)
    })
    actions.appendChild(b)
  }
}
