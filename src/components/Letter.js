import Tone from 'tone'
import Store from 'core/Store'
import STEPS from 'config/steps'
import * as PIXI from 'pixi.js'

import map from 'utils/map'
import ms2px from 'utils/ms2px'
import px2ms from 'utils/px2ms'
import { scale, interpolate, getDistance, getFirstPoints, compress } from 'utils/drawingTools'

const DEBUG = false
const SCALE = window.innerHeight / 1000

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

    this.container = new PIXI.Container()
    this.graphics = new PIXI.Graphics()

    this.drawing = scale(opts.drawing, SCALE)

    this.container.x = Store.get('distance')
    this.container.y = Store.get('size').h / 2 + 100
    this.container.addChild(this.graphics)
    this.yOffset = null
    this.drawPhaseX = 0
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
    this.drawPhaseX += ms2px(dt)
    // this.drawPhaseX += ms2px(dt * Store.get('speed'))
    // const scale = this.container.scale.x
    if (this.step === STEPS.ENDED) return

    if (this.step === STEPS.ATTACK) {
      // start attack
      if (!this.adDuration) {
        this.adDuration = (this.attack + this.decay) * 1000
        this.adDistance = ms2px(this.adDuration)

        // homothetic resizing if we don't have enough place
        const totalDist = getDistance(this.drawing.attackBegin) + getDistance(this.drawing.attackEnd)
        if (this.adDistance < totalDist) {
          const coef = this.adDistance / totalDist
          this.drawing.attackBegin = compress(this.drawing.attackBegin, coef)
          this.drawing.attackEnd = compress(this.drawing.attackEnd, coef)
        }

        this.adEndDuration = px2ms(getDistance(this.drawing.attackEnd))
        this.previousPaths = this.modifyPoints(getFirstPoints(this.drawing.attackBegin))
        this.drawPhase = 'attackBegin'
        this.drawPhaseX = 0
      }
      if (this.drawPhase !== 'attackEnd' && this.life >= (this.adDuration - this.adEndDuration)) {
        this.drawPhase = 'attackEnd'
        this.drawPhaseX = 0
      }
    } // eslint-disable-line

    else if (this.step === STEPS.SUSTAIN) {
      if (this.drawPhase !== 'sustain') {
        this.currentDrawPaths = this.drawing.sustain
        this.previousPaths = this.modifyPoints(getFirstPoints(this.drawing.sustain))
        this.drawPhase = 'sustain'
        this.drawPhaseX = 0
      }
    } // eslint-disable-line

    else if (this.step === STEPS.RELEASE) {
      if (!this.lifeFromRelease) {
        this.lifeFromRelease = this.life
        this.rDuration = (this.release) * 1000
        this.rDistance = ms2px(this.rDuration)

        // homothetic resizing if we don't have enough place
        const totalDist = getDistance(this.drawing.releaseBegin) + getDistance(this.drawing.releaseEnd)
        if (this.rDistance < totalDist) {
          const coef = this.rDistance / totalDist
          this.drawing.releaseBegin = compress(this.drawing.releaseBegin, coef)
          this.drawing.releaseEnd = compress(this.drawing.releaseEnd, coef)
        }

        this.rEndDuration = px2ms(getDistance(this.drawing.releaseEnd))
        this.previousPaths = this.modifyPoints(getFirstPoints(this.drawing.releaseBegin))
        this.drawPhase = 'releaseBegin'
        this.drawPhaseX = 0
      }
      if (this.drawPhase !== 'releaseEnd' && (this.life - this.lifeFromRelease) >= (this.rDuration - this.rEndDuration)) {
        this.drawPhase = 'releaseEnd'
        this.drawPhaseX = 0
      }
    }

    this.nextPaths = this.modifyPoints(interpolate(this.drawing[this.drawPhase], this.drawPhaseX))

    const pdist = this.pdistance
    const cdist = this.distance

    const color = this.modifyColor()
    this.graphics.beginFill(color.color, color.alpha)

    for (let i = 0; i < this.previousPaths.length; i++) {
      let points = []
      const previousPoints = this.previousPaths[i]
      const nextPoints = this.nextPaths[i].slice().reverse()
      previousPoints.forEach(pt => {
        if (pt === null) return
        points.push(pdist, pt)
      })
      nextPoints.forEach(pt => {
        if (pt === null) return
        points.push(cdist, pt)
      })
      if (points.length > 0) this.graphics.drawPolygon(points)
    }

    this.previousPaths = this.nextPaths
    this.graphics.endFill()
  }

  modifyColor () {
    const color = 0x000000
    const alpha = 1 // map(this.env.value, 0, 1, 0.3, 1)
    return { color, alpha }
  }

  modifyPoints (points) {
    const detune = (Math.cos(Store.get('time') * Store.get('fx.lfoFreq') / 1000) - 0.5) * Store.get('fx.lfoAmp')
    this.osc.detune.value = detune

    let nPoints = points.map(point => {
      return point.map(v => {
        let out = v !== null ? v - detune : v
        if (v !== null) out -= -180 * SCALE + this.id * (5 * SCALE)
        return out
      })
    })

    // calc offset for sprite rendering
    nPoints.forEach(point => point.forEach(v => {
      if (v === null) return
      if (this.yOffset === null || v > this.yOffset) this.yOffset = v
    }))

    return nPoints
    // modify points with FBO or other stuff
  }
}
