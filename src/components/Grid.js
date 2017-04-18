import * as PIXI from 'pixi.js'
import Store from 'core/Store'
import px2ms from 'utils/px2ms'
import ms2px from 'utils/ms2px'

const BPM = 100
const QUART = ((60000 / BPM) / 4) * 4

export default class Grid {
  constructor () {
    this.container = new PIXI.Container()
    this.tile = null
    this.lines = []
    this.w = Store.get('size').w
    this.h = Store.get('size').h
    this.zoom = Store.get('zoom')
    this.reset()
  }

  tick (dt) {
    const distance = Store.get('distance')
    if (!this.tile) return
    this.container.x = distance - this.w / 2
    this.tile.tilePosition = new PIXI.Point(-distance, 0)
  }

  reset () {
    if (this.tile) this.tile.destroy()

    const step = ms2px(QUART)
    const width = step * 4
    const height = 10
    const graphic = new PIXI.Graphics()
    graphic.width = width
    graphic.height = height

    for (let i = 0; i < 5; i++) {
      graphic.lineStyle(1, !i ? 0x333333 : 0xdddddd, i === 5 ? 0 : 1)
      graphic.moveTo(i * step, 0)
      graphic.lineTo(i * step, height)
    }

    const tex = Store.get('renderer').generateTexture(graphic, 1, window.devicePixelRatio)
    this.tile = new PIXI.extras.TilingSprite(tex)
    this.tile.height = Store.get('size').h
    this.tile.width = Store.get('size').w
    this.container.addChild(this.tile)
  }
}
