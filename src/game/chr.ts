export const TILE_SIZE = 16

const PALETTE_STR = '330440550660770020030040050060070222555'

function scale3to8(v: number): number {
  return Math.round((v * 255) / 7)
}

export type RGB = readonly [number, number, number]

export const PALETTE: ReadonlyArray<RGB> = (() => {
  const p: RGB[] = new Array(16) as RGB[]
  for (let i = 0; i < 16; i++) p[i] = [0, 0, 0]
  p[1] = [0, 0, 0]
  p[15] = [255, 255, 255]
  for (let i = 0; i < 13; i++) {
    const r = Number(PALETTE_STR[i * 3])
    const g = Number(PALETTE_STR[i * 3 + 1])
    const b = Number(PALETTE_STR[i * 3 + 2])
    p[i + 2] = [scale3to8(r), scale3to8(g), scale3to8(b)]
  }
  return p
})()

const CR_RAW =
  '0010,0010,0000,0000,0000,0000,0000,0000,0000,0000,0000,2200,0022,0000,0000,3322,2233,0000,0200,4433,3344,0020,0200,5534,4355,0020,2300,6645,5466,0032,2300,6645,5466,0032,2300,6645,5466,0032,2300,6645,5466,0032,0200,5534,4355,0020,0200,4433,3344,0020,0000,3322,2233,0000,0000,2200,0022,0000,0000,0000,0000,0000,0000,0000,0000,0000,0000'

const BR_RAW =
  '0010,0010,7707,7777,7777,0077,8878,8888,8888,7088,9978,9999,9999,7098,9A78,AAAA,AAAA,7098,9A78,BBBB,BABB,7098,9A78,CCBC,BACC,7098,9A78,CCBC,BACC,7098,9A78,CCBC,BACC,7098,9A78,CCBC,BACC,7098,9A78,CCBC,BACC,7098,9A78,CCBC,BACC,7098,9A78,BBBB,BABB,7098,9A78,AAAA,AAAA,7098,9978,9999,9999,7098,8878,8888,8888,7088,7707,7777,7777,0077,0000'

const MY_RAW =
  '0010,0010,0000,0700,0000,0000,0000,7877,7077,0000,7700,8988,8788,0070,8807,9A99,9899,0087,8907,ABAA,A9AA,0087,9D78,BCDD,DDBD,7098,DE78,DCEE,EEDE,70D8,EF7D,EDFF,0FEF,70ED,EF7D,EDFF,FFEF,70ED,EF7D,ED0F,FFEF,70ED,DE78,DAEE,EEDE,70D8,8D07,99DD,DD9D,0087,7700,8877,7787,0070,3303,7733,3373,0033,6634,3064,6634,3064,3303,0033,3303,0033,0000'

export interface Sprite {
  w: number
  h: number
  pixels: Uint8Array
}

function parseWords(s: string): number[] {
  return s.split(',').map((w) => parseInt(w, 16))
}

export function decodeSprite(words: number[]): Sprite {
  const w = words[0]
  const h = words[1]
  const pixels = new Uint8Array(w * h)
  let p = 2
  const wordsPerRow = w / 4
  for (let y = 0; y < h; y++) {
    for (let wx = 0; wx < wordsPerRow; wx++) {
      const word = words[p++]
      const lo = word & 0xff
      const hi = (word >> 8) & 0xff
      const base = y * w + wx * 4
      pixels[base + 0] = (lo >> 4) & 0xf
      pixels[base + 1] = lo & 0xf
      pixels[base + 2] = (hi >> 4) & 0xf
      pixels[base + 3] = hi & 0xf
    }
  }
  return { w, h, pixels }
}

export const CRYSTAL_DATA = decodeSprite(parseWords(CR_RAW))
export const BRICK_DATA = decodeSprite(parseWords(BR_RAW))
export const PLAYER_DATA = decodeSprite(parseWords(MY_RAW))

export function spriteToCanvas(sprite: Sprite): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = sprite.w
  canvas.height = sprite.h
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(sprite.w, sprite.h)
  for (let i = 0; i < sprite.pixels.length; i++) {
    const idx = sprite.pixels[i]
    const [r, g, b] = PALETTE[idx]
    img.data[i * 4 + 0] = r
    img.data[i * 4 + 1] = g
    img.data[i * 4 + 2] = b
    img.data[i * 4 + 3] = idx === 0 ? 0 : 255
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}
