import midigui from 'midigui'
import raf from 'raf'
import Stats from 'stats.js'
import jupik from 'components/jupik'
import keyboard from 'components/keyboard'
import debounce from 'lodash/debounce'
import Store from 'core/Store'
import Events from 'core/Events'
import letterLog from 'components/letterLog'

document.addEventListener('DOMContentLoaded', () => {
  const stats = new Stats()
  stats.dom.style.left = 'auto'
  stats.dom.style.right = '0'
  // document.body.appendChild(stats.dom)

  let zoomMode = true
  const scrollButton = document.createElement('button')
  scrollButton.addEventListener('click', onButtonClick)
  updateButtonText()

  const offsetButton = document.createElement('button')
  offsetButton.addEventListener('click', updateOffsetButton)
  Store.set('button.letterOffset', false); updateOffsetButton()

  const $inverter = document.querySelector('.inverter')
  const darkModeButton = document.createElement('button')
  darkModeButton.addEventListener('click', () => { toggleDarkMode() })
  toggleDarkMode(false)

  const controller = midigui({ visible: false, key: '=' })
    .add('attack')
    .add('decay')
    .add('sustain')
    .add('release')
    .add('lfoFreq')
    .add('lfoAmp')

  controller.on('attack', val => Events.dispatch('controller.attack', val))
  controller.on('decay', val => Events.dispatch('controller.decay', val))
  controller.on('sustain', val => Events.dispatch('controller.sustain', val))
  controller.on('release', val => Events.dispatch('controller.release', val))
  controller.on('lfoFreq', val => Events.dispatch('controller.lfoFreq', val))
  controller.on('lfoAmp', val => Events.dispatch('controller.lfoAmp', val))

  Store.set('midi.attack', 0)
  Store.set('midi.release', 0)

  keyboard({ monokey: false })
  letterLog(document.getElementById('letterlog'))
  const $controller = document.getElementById('controller')
  const $canvas = document.getElementById('app')
  const app = jupik({
    canvas: $canvas,
    controller: $controller
  })
  $controller.appendChild(scrollButton)
  $controller.appendChild(offsetButton)
  $controller.appendChild(darkModeButton)
  raf.add(tick)

  window.addEventListener('resize', debounce(resize, 100))
  resize()

  $canvas.addEventListener('mousewheel', wheel)

  function wheel (e) {
    if (zoomMode) app.zoom(e.deltaY / 10000)
    else app.pan(e.deltaY / 10)
  }

  function resize () {
    app.resize(window.innerWidth, window.innerHeight)
  }

  function tick (dt) {
    stats.begin()
    app.tick(dt)
    stats.end()
  }

  function onButtonClick () {
    zoomMode = !zoomMode
    updateButtonText()
  }

  function updateButtonText () {
    scrollButton.textContent = zoomMode ? 'Scroll: PAN' : 'Scroll: ZOOM'
  }

  function updateOffsetButton () {
    const nVal = !Store.get('button.letterOffset')
    Store.set('button.letterOffset', nVal)
    offsetButton.textContent = nVal ? 'Letter Offset OFF' : 'Letter Offset ON'
  }

  function toggleDarkMode (force) {
    const nVal = force !== undefined ? force : !$inverter.classList.contains('inverted')
    if (nVal) $inverter.classList.add('inverted')
    else $inverter.classList.remove('inverted')
    darkModeButton.textContent = nVal ? 'Bright Mode' : 'Dark Mode'
  }

})

