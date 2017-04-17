import Tone from 'tone'
import Store from 'core/Store'
import STEPS from 'config/steps'
import * as PIXI from 'pixi.js'

const defaultOpts = {
  frequency: 'C4'
}

export default class Letter {
  constructor (opts) {
    opts = Object.assign({}, defaultOpts, opts)
    this.container = new PIXI.Container()

    this.osc = new Tone.OmniOscillator()
    this.osc.frequency.value = opts.frequency
    this.osc.type = 'sine'
    this.env = new Tone.AmplitudeEnvelope()
    this.osc.connect(this.env)
    this.env.toMaster()

    this.plife = 0
    this.life = 0
    this.releaseInterval = 0
    this.step = STEPS.UNSTARTED
  }

  start () {
    this.step = STEPS.ATTACK
    this.attack = Store.get('fx.attack')
    this.decay = Store.get('fx.decay')
    this.env.attack = this.attack
    this.env.decay = this.decay
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

  onAttackBegins () { console.log('Attack/Decay Begins') }

  onAttack () { console.log('Attack/Decay') }

  onAttackEnds () { console.log('Attack/Decay Ends') }

  onSustainBegins () { console.log('Sustain Begins') }

  onSustain () { console.log('Sustain') }

  onSustainEnds () { console.log('Sustain Ends') }

  onReleaseBegins () { console.log('Release Begins') }

  onRelease () { console.log('Release') }

  onReleaseEnds () { console.log('Release Ends') }

  onEnded () {}

  tick (dt) {
    if (this.step === STEPS.UNSTARTED) return
    this.plife = this.life
    this.life += dt

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
  }
}
