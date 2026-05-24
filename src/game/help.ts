let overlay: HTMLDivElement | null = null

const HELP_HTML = `
  <div class="help-panel">
    <h1>遊び方</h1>

    <p>「詰めペンゴ」系のパズルゲームです。</p>

    <h2>ルール</h2>
    <ul>
      <li>自分（魔法使い／玉ねぎ）を動かして、クリスタル（宝箱）を <b>縦か横に3つ並べる</b> とクリア</li>
      <li>斜め並びはNG</li>
      <li>クリスタルは押すと滑って端まで進む。背後に障害物があると動かない</li>
      <li>ブロック（青ボタン／緑レンガ）は押すと滑る。背後に何かあると <b>壊れる</b></li>
      <li>各面に <b>ステップ数の上限</b> あり、超えるとクリア不能</li>
      <li>外枠に沿った3並びはクリアにならない</li>
    </ul>

    <h2>操作</h2>
    <table>
      <tr><td><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> / <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></td><td>移動・タイトルでメニュー選択</td></tr>
      <tr><td><kbd>Enter</kbd> / <kbd>Space</kbd></td><td>決定 / クリア後 次の面へ</td></tr>
      <tr><td><kbd>R</kbd></td><td>同じ面をリトライ</td></tr>
      <tr><td><kbd>G</kbd></td><td>タイトル画面に戻る</td></tr>
      <tr><td><kbd>C</kbd></td><td>タイトルでコンティニュー（中断面から再開）</td></tr>
    </table>

    <p class="hint">スマートフォンは画面下の十字＋A/R/Gボタン。</p>

    <button class="help-close" type="button">閉じる</button>
  </div>
`

function ensureOverlay(): HTMLDivElement {
  if (overlay) return overlay
  overlay = document.createElement('div')
  overlay.id = 'help-overlay'
  overlay.innerHTML = HELP_HTML
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) hideHelp()
  })
  overlay.querySelector('.help-close')!.addEventListener('click', hideHelp)
  document.body.appendChild(overlay)
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && isHelpVisible()) {
      ev.preventDefault()
      hideHelp()
    }
  })
  return overlay
}

export function showHelp(): void {
  ensureOverlay().classList.add('show')
  document.body.classList.add('help-visible')
}

export function hideHelp(): void {
  if (overlay) overlay.classList.remove('show')
  document.body.classList.remove('help-visible')
}

export function isHelpVisible(): boolean {
  return !!overlay && overlay.classList.contains('show')
}
