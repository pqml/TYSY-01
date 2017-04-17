import Letter from 'components/Letter'
import STEPS from 'config/steps'
import * as PIXI from 'pixi.js'
import ms2px from 'utils/ms2px'
import Store from 'core/Store'

export default class A extends Letter {
  constructor () {
    super({
      frequency: 'C4'
    })
    this.graphics = new PIXI.Graphics()
    this.container.addChild(this.graphics)
  }

  tick (dt) {
    super.tick(dt)
    const scale = this.container.scale.x
    if (this.step !== STEPS.ENDED) {
      //this.graphics.beginFill(utils.rgb2hex([Math.random(), Math.random(), Math.random()]))
      this.graphics.beginFill(0x000000)
      this.graphics.drawPolygon(
        new PIXI.Polygon(
          ms2px(this.plife), -50 - (Math.random()) * this.life / 100,
          ms2px(this.plife), 50 + (Math.random()) * this.life / 100,
          ms2px(this.life), 50 + (Math.random()) * this.life / 100,
          ms2px(this.life), -50 - (Math.random()) * this.life / 100
        )
      )
      this.graphics.alpha = 1
      this.graphics.endFill()
      this.container.y = window.innerHeight / 2
    }
  }


  onReleaseEnds () {
    // const scale = this.container.scale.x
    this.sprite = new PIXI.Sprite(Store.get('renderer').generateTexture(this.container, 5, 2))
    console.log(this.sprite.width)
    this.sprite.y = -this.sprite.height / 2
    this.graphics.destroy()
    this.container.addChild(this.sprite)
    // this.container.scale.set(this.life/1000)
  }
}
