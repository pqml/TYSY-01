import * as PIXI from 'pixi.js'
import Events from 'core/Events'
import Store from 'core/Store'

import * as Letters from 'components/Letters'
import Grid from 'components/Grid'
import slider from 'components/slider'

import ms2px from 'utils/ms2px'
import map from 'utils/map'
import bounds from 'config/bounds'

const defaultOpts = {}

function jupik (opts) {
  opts = Object.assign({}, defaultOpts, opts)

  const stage = new PIXI.Container()
  const camera = new PIXI.Container()

  // Start from the middle of the screen
  // stage.x = window.innerWidth / 2

  const renderer = PIXI.autoDetectRenderer(
    window.innerWidth,
    window.innerHeight,
    {
      view: opts.canvas,
      resolution: window.devicePixelRatio,
      backgroundColor: 0xffffff,
      antialias: false
    }
  )

  // renderer.view.style['width'] = window.innerWidth + 'px'
  // renderer.view.style['height'] = window.innerHeight + 'px'

  let letters = {}

  Events.on('keyboard.on', letterOn)
  Events.on('keyboard.off', letterOff)

  Events.on('controller.attack', attackChange)
  Events.on('controller.decay', decayChange)
  Events.on('controller.release', releaseChange)
  Events.on('controller.sustain', sustainChange)
  Events.on('controller.lfoFreq', lfoFreqChange)
  Events.on('controller.lfoAmp', lfoAmpChange)

  const controller = opts.controller
  controller.appendChild(slider({
    name: 'Tempo',
    syncWith: 'controller.tempo',
    onInput: tempoChange,
    default: map(120, bounds.minTempo, bounds.maxTempo, 0, 127),
    units: 'bpm',
    transform (v) { return map(v, 0, 127, bounds.minTempo, bounds.maxTempo) | 0 }
  }))


  controller.appendChild(slider({
    name: 'Attack',
    syncWith: 'controller.attack',
    onInput: attackChange,
    transform (v) { return map(v, 0, 127, bounds.minAttack, bounds.maxAttack).toFixed(2) }
  }))

  controller.appendChild(slider({
    name: 'Decay',
    syncWith: 'controller.decay',
    onInput: decayChange,
    transform (v) { return map(v, 0, 127, bounds.minDecay, bounds.maxDecay).toFixed(2) }
  }))

  controller.appendChild(slider({
    name: 'Sustain',
    syncWith: 'controller.sustain',
    onInput: sustainChange,
    default: 127,
    units: '%',
    transform (v) { return map(v, 0, 127, 0, 100).toFixed(2) }
  }))

  controller.appendChild(slider({
    name: 'Release',
    syncWith: 'controller.release',
    onInput: releaseChange,
    transform (v) { return map(v, 0, 127, bounds.minRelease, bounds.maxRelease).toFixed(2) }
  }))

  controller.appendChild(slider({
    name: 'LFO Freq',
    syncWith: 'controller.lfoFreq',
    onInput: lfoFreqChange,
    default: 0.01,
    units: '',
    transform (v) { return map(v, 0, 127, bounds.minLfoFreq, bounds.maxLfoFreq).toFixed(2) }
  }))

  controller.appendChild(slider({
    name: 'LFO Amp',
    syncWith: 'controller.lfoAmp',
    onInput: lfoAmpChange,
    default: 0,
    units: '',
    transform (v) { return map(v, 0, 127, bounds.minLfoAmp, bounds.maxLfoAmp).toFixed(2) }
  }))




  Store.set('speed', 1)
  Store.set('pan', 0)
  Store.set('scale', 1)
  Store.set('renderer', renderer)
  Store.set('zoom', 1)
  Store.set('size', { w: window.innerWidth, h: window.innerHeight })
  Store.set('time', 0)
  Store.set('distance', 0)
  Store.set('fx.attack', bounds.minAttack / 1000)
  Store.set('fx.decay', bounds.minDecay / 1000)
  Store.set('fx.release', bounds.minRelease / 1000)
  sustainChange(127)
  lfoFreqChange(0.01)
  lfoAmpChange(0)

  const grid = new Grid()
  controller.appendChild(grid.button)

  stage.x = 0
  stage.y = -window.innerHeight / 2
  camera.addChild(grid.container)
  camera.addChild(stage)
  camera.x = window.innerWidth / 2
  camera.y = window.innerHeight / 2

  // const log = new letterLog()

  return {
    tick,
    resize,
    zoom,
    pan
  }

  function tempoChange (tempo) {
    const value = map(tempo, 0, 127, bounds.minTempo, bounds.maxTempo) | 0
    Store.set('fx.tempo', value)
    Store.set('speed', value / 127)
  }

  function attackChange (attack) {
    const value = map(attack, 0, 127, bounds.minAttack, bounds.maxAttack) / 1000
    Store.set('fx.attack', value)
  }

  function decayChange (decay) {
    const value = map(decay, 0, 127, bounds.minDecay, bounds.maxDecay) / 1000
    Store.set('fx.decay', value)
  }

  function releaseChange (release) {
    const value = map(release, 0, 127, bounds.minRelease, bounds.maxRelease) / 1000
    Store.set('fx.release', value)
  }

  function sustainChange (sustain) {
    const value = map(sustain, 0, 127, 0, 100) / 100
    Store.set('fx.sustain', value)
  }

  function lfoFreqChange (val) {
    val = map(val, 0, 127, bounds.minLfoFreq, bounds.maxLfoFreq)
    Store.set('fx.lfoFreq', val)
  }

  function lfoAmpChange (val) {
    val = map(val, 0, 127, bounds.minLfoAmp, bounds.maxLfoAmp)
    Store.set('fx.lfoAmp', val)
  }

  function letterOn (letter) {
    if (!Letters[letter]) return
    if (!letters[letter]) letters[letter] = []
    const newLetter = new Letters[letter]()
    letters[letter].push(newLetter)
    newLetter.start()
    stage.addChild(newLetter.container)
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

  function zoom (value) {
    const scale = Math.max(0.01, camera.scale.x + value)
    // stage.x = ms2px(Store.get('time'))
    // console.log(scale)

    // const offset = val * Store.get('size').w / 2 * scale / 2
    // stage.x = stage.x - stage.x * val
    setScale(scale)
  }

  function pan (val) {
    Store.set('pan', Math.max(0, Store.get('pan') + val))
    console.log(Store.get('pan'))
  }

  function setScale (scale) {
    Store.set('scale', scale)
    camera.scale.set(scale)
    grid.zoom()
  }

  function tick (dt) {
    // update global time & distance
    const ntime = Store.get('time') + dt
    const ndist = Store.get('distance') + ms2px(dt * Store.get('speed'))
    Store.set('time', ntime)
    Store.set('distance', ndist)

    // const speed = 1
    // const offset = (Store.get('size').w / 4)
    // const autoscale = (ndist / offset >= 1)
    //   ? (1 / (ndist / offset)) * speed
    //   : 1

    // console.log(autoscale)
    // setScale(autoscale)

    // update grid position
    grid.tick(dt)

    // update all char
    for (let k in letters) letters[k].forEach(letter => letter.tick(dt))

    // render the scene
    stage.x = -ndist + Store.get('pan') //* Store.get('scale')
    renderer.render(camera)
  }
}

export default jupik
