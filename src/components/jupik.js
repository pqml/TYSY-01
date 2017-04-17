import * as PIXI from 'pixi.js'
import Events from 'core/Events'
import Store from 'core/Store'

import * as Letters from 'components/Letters'
import Grid from 'components/Grid'

const defaultOpts = {
  maxAttack: 2,
  maxRelease: 2,
  maxDecay: 1
}

function jupik (opts) {
  opts = Object.assign({}, defaultOpts, opts)

  const stage = new PIXI.Container()

  const renderer = PIXI.autoDetectRenderer(
    window.innerWidth,
    window.innerHeight,
    {
      view: opts.canvas,
      resolution: window.devicePixelRatio,
      backgroundColor: 0xffffff,
      antialias: true
    }
  )

  renderer.view.style['width'] = window.innerWidth + 'px'
  renderer.view.style['height'] = window.innerHeight + 'px'

  let letters = {}

  Events.on('keyboard.on', letterOn)
  Events.on('keyboard.off', letterOff)
  Events.on('controller.attack', attackChange)
  Events.on('controller.decay', decayChange)
  Events.on('controller.release', releaseChange)

  Store.set('renderer', renderer)
  Store.set('zoom', 1)
  Store.set('size', { w: window.innerWidth, h: window.innerHeight })
  Store.set('time', 0)
  Store.set('fx.attack', 0)
  Store.set('fx.decay', 0)
  Store.set('fx.sustain', 0)
  Store.set('fx.release', 0)

  const grid = new Grid()
  stage.addChild(grid.container)

  return {
    tick,
    resize
  }

  function attackChange (attack) {
    const value = attack / 127 * opts.maxAttack
    Store.set('fx.attack', value)
  }

  function decayChange (decay) {
    const value = decay / 127 * opts.maxDecay
    Store.set('fx.decay', value)
  }

  function releaseChange (release) {
    const value = release / 127 * opts.maxRelease
    Store.set('fx.release', value)
  }

  function letterOn (letter) {
    if (!Letters[letter]) return
    if (!letters[letter]) letters[letter] = []
    const newLetter = new Letters[letter]()
    letters[letter].push(newLetter)
    newLetter.start()
    stage.addChild(newLetter.container)
    console.log(newLetter.container)
  }

  function letterOff (letter) {
    if (!Letters[letter]) return
    if (!letters[letter] || letters[letter].length < 1) return
    const lastLetter = letters[letter][letters[letter].length - 1]
    lastLetter.stop()
  }

  function resize (w, h) {
    Store.set('size', { w, h })
  }

  function tick (dt) {
    // update global time
    Store.set('time', dt)

    // update grid position
    grid.tick(dt)

    // update all char
    for (let k in letters) letters[k].forEach(letter => letter.tick(dt))

    // render the scene
    renderer.render(stage)
  }
}

export default jupik
