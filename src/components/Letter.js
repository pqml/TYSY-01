import Tone from 'tone'
import Store from 'core/Store'
import STEPS from 'config/steps'
import * as PIXI from 'pixi.js'

import ms2px from 'utils/ms2px'

import jupikGlyph from 'components/jupikGlyph'

const DEBUG = false
const SCALE = window.innerHeight / 2300
const Y_OFFSET = 800

const defaultOpts = {
  frequency: 'C4'
}

export default class Letter {
  constructor (opts) {
    opts = Object.assign({}, defaultOpts, opts)
    this.id = opts.id | 0

    this.osc = new Tone.OmniOscillator()
    this.osc.frequency.value = opts.frequency
    this.osc.type = 'sine'

    this.env = new Tone.AmplitudeEnvelope()
    this.env.releaseCurve = 'cosine'
    this.osc.connect(this.env)
    this.env.toMaster()

    this.plife = 0
    this.life = 0
    this.pdistance = 0
    this.distance = 0
    this.releaseInterval = 0
    this.step = STEPS.UNSTARTED

    this.glyph = jupikGlyph()
      .importGlyph(opts.glyph)
      .setScale(SCALE)

    this.container = new PIXI.Container()
    this.graphics = new PIXI.Graphics()

    this.container.x = Store.get('distance') + Store.get('size').w / 2 - 230
    this.container.y = Store.get('size').h / 2
    this.container.addChild(this.graphics)
    this.yOffset = null
    this.drawPhaseX = 0

    this.letterOffset = Store.get('button.letterOffset')
  }

  start () {
    this.step = STEPS.ATTACK_STARTED
    this.attack = Store.get('fx.attack')
    this.decay = Store.get('fx.decay')
    this.sustain = Store.get('fx.sustain')
    this.env.attack = this.attack
    this.env.decay = this.decay
    this.env.sustain = this.sustain
    this.osc.start()
    this.env.triggerAttack()
  }

  stop () {
    this.step = STEPS.RELEASE_STARTED
    this.release = Store.get('fx.release')
    this.env.release = this.release
    this.env.triggerRelease()
  }

  dispose () {
    this.step = STEPS.ENDED
    this.osc.dispose()
    this.env.dispose()
  }

  onAttackBegins () { if (DEBUG) console.log('Attack/Decay Begins') }

  onAttack () { if (DEBUG) console.log('Attack/Decay') }

  onAttackEnds () { if (DEBUG) console.log('Attack/Decay Ends') }

  onSustainBegins () { if (DEBUG) console.log('Sustain Begins') }

  onSustain () { if (DEBUG) console.log('Sustain') }

  onSustainEnds () { if (DEBUG) console.log('Sustain Ends') }

  onReleaseBegins () { if (DEBUG) console.log('Release Begins') }

  onRelease () { if (DEBUG) console.log('Release') }

  onReleaseEnds () {
    if (DEBUG) console.log('Release Ends')

    if (this.graphics.width === 0 || this.graphics.height === 0) return

    // cache the graphics in a texture to optimize performance
    this.sprite = new PIXI.Sprite(Store.get('renderer').generateTexture(this.container, 1, window.devicePixelRatio))
    this.sprite.anchor.set(0, 1)
    // console.log(this.sprite.y)
    this.sprite.y = this.yOffset
    this.graphics.destroy()
    this.container.addChild(this.sprite)
    this.dispose()
  }

  onEnded () {}

  tick (dt) {
    // lifecycle
    if (this.step === STEPS.UNSTARTED) return
    this.plife = this.life
    this.life += dt
    this.pdistance = this.distance
    this.distance += ms2px(dt * Store.get('speed'))

    if (this.step === STEPS.ATTACK_STARTED) {
      this.onAttackBegins()
      this.step = STEPS.ATTACK
    }

    if (this.step === STEPS.ATTACK) {
      if (this.life < (this.attack + this.decay) * 1000) {
        this.onAttack()
      } else {
        this.onAttackEnds()
        this.step = STEPS.SUSTAIN_STARTED
      }
    }

    if (this.step === STEPS.SUSTAIN_STARTED) {
      this.onSustainBegins()
      this.step = STEPS.SUSTAIN
    }

    if (this.step === STEPS.SUSTAIN) {
      this.onSustain()
    }

    if (this.step === STEPS.RELEASE_STARTED) {
      this.onSustainEnds()
      this.onReleaseBegins()
      this.step = STEPS.RELEASE
    }

    if (this.step === STEPS.RELEASE) {
      this.releaseInterval += dt
      if (this.releaseInterval < this.release * 1000) {
        this.onRelease()
      } else {
        this.onReleaseEnds()
        this.step = STEPS.ENDED
      }
    }

    if (this.step === STEPS.ENDED) {
      this.onEnded()
    }

    if (this.step !== STEPS.ENDED) this.draw(dt)
  }

  draw (dt) {
    this.currentStepX += ms2px(dt)
    if (this.step === STEPS.ENDED) return
    // initialization when each step are starting
    if (this.step === STEPS.ATTACK && this.currentStep !== 'attack') {
      this.adDuration = (this.attack + this.decay) * 1000
      this.adDistance = ms2px(this.adDuration)
      this.glyph.setAttackSize(this.adDistance * (1 / SCALE))
      this.currentStep = 'attack'
      this.previousGlyphSlice = null
      this.currentStepX = 0
    } else if (this.step === STEPS.SUSTAIN && this.currentStep !== 'sustain') {
      this.currentStep = 'sustain'
      this.previousGlyphSlice = null
      this.currentStepX = 0
    } else if (this.step === STEPS.RELEASE && this.currentStep !== 'release') {
      this.rDuration = (this.release) * 1000
      this.rDistance = ms2px(this.rDuration)
      this.glyph.setReleaseSize(this.rDistance * (1 / SCALE))
      this.currentStep = 'release'
      this.previousGlyphSlice = null
      this.currentStepX = 0
    }
    // draw
    const pX = this.pdistance
    const cX = this.distance

    this.currentGlyphSlice = this.modifyY(
      this.glyph.getSlice(this.currentStep, this.currentStepX)
    )

    if (!this.currentGlyphSlice) return
    if (this.previousGlyphSlice === null) this.previousGlyphSlice = this.currentGlyphSlice.slice()

    const color = this.modifyColor((this.currentGlyphSlice.length !== this.previousGlyphSlice.length))

    if (this.previousGlyphSlice.length !== this.currentGlyphSlice.length) {
      this.previousGlyphSlice = this.currentGlyphSlice.slice()
    }

    this.graphics.beginFill(color.color, color.alpha)
    for (let i = 0; i < this.previousGlyphSlice.length; i += 2) {
      const pY1 = this.previousGlyphSlice[i]
      const pY2 = this.previousGlyphSlice[i + 1]
      const cY1 = this.currentGlyphSlice[i]
      const cY2 = this.currentGlyphSlice[i + 1]
      this.graphics.drawPolygon([
        pX, pY1,
        pX, pY2,
        cX, cY2,
        cX, cY1
      ])
    }

    this.graphics.endFill()
    this.previousGlyphSlice = this.currentGlyphSlice.slice()
  }

  modifyColor (red) {
    const color = red ? 0x000000 : 0x000000
    const alpha = 1 // map(this.env.value, 0, 1, 0.3, 1)
    return { color, alpha }
  }

  modifyY (yList) {
    if (!yList) return false
    const detune = (Math.cos(Store.get('time') * Store.get('fx.lfoFreq') / 1000) - 0.5) * Store.get('fx.lfoAmp')
    this.osc.detune.value = detune

    // offset based on letter ID to limit letter overlap
    const newYList = yList.map(y => {
      y -= detune
      y -= Y_OFFSET * SCALE
      if (this.letterOffset) y -= this.id * (10 * SCALE)
      return y
    })
    // console.log(newYList)
    // calc offset for sprite rendering
    newYList.forEach(y => {
      if (this.yOffset === null || y > this.yOffset) this.yOffset = y
    })

    return newYList
    // modify points with FBO or other stuff
  }
}
