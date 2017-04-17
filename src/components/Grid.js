import * as PIXI from 'pixi.js'
import Store from 'core/Store'
import px2ms from 'utils/px2ms'
import ms2px from 'utils/ms2px'

const BPM = 50
const QUART = ((60000 / BPM) / 4) * 4

export default class Grid {
  constructor () {
    this.container = new PIXI.Container()
    this.w = Store.get('size').w
    this.h = Store.get('size').h
    this.zoom = Store.get('zoom')
    this.reset()
  }

  tick (dt) {

  }

  reset () {
    const time = Store.get('time')
    const sceneDuration = px2ms(this.w)
    for (let i = 0; i <= sceneDuration; i += QUART) {
      this.container.addChild(this.line(i))
    }
  }

  line (time) {
    const x = ms2px(time)
    this.graphics = new PIXI.Graphics()
    this.graphics.lineStyle(1, 0, 1)
    this.graphics.moveTo(x, 0)
    this.graphics.lineTo(x, this.h)
    return this.graphics
  }
}
