const canvas = document.getElementById('screen') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
ctx.imageSmoothingEnabled = false

ctx.fillStyle = '#000'
ctx.fillRect(0, 0, canvas.width, canvas.height)

ctx.fillStyle = '#fff'
ctx.font = '16px monospace'
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText('CRYSTAL STORY', canvas.width / 2, canvas.height / 2 - 8)
ctx.font = '8px monospace'
ctx.fillText('(skeleton)', canvas.width / 2, canvas.height / 2 + 12)
