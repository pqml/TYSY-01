import midigui from 'midigui'
import raf from 'raf'
import Stats from 'stats.js'
import jupik from 'components/jupik'
import keyboard from 'components/keyboard'
import debounce from 'lodash/debounce'
import Store from 'core/Store'
import Events from 'core/Events'

const stats = new Stats()
stats.dom.style.left = 'auto'
stats.dom.style.right = '0'
document.body.appendChild(stats.dom)

const controller = midigui()
  .add('attack')
  .add('decay')
  .add('sustain')
  .add('release')

controller.on('attack', val => Events.dispatch('controller.attack', val))
controller.on('decay', val => Events.dispatch('controller.decay', val))
controller.on('sustain', val => Events.dispatch('controller.sustain', val))
controller.on('release', val => Events.dispatch('controller.release', val))

Store.set('midi.attack', 0)
Store.set('midi.release', 0)

keyboard({ monokey: true })
const app = jupik({
  canvas: document.getElementById('app')
})

raf.add(tick)

window.addEventListener('resize', debounce(resize, 100))
resize()

function resize () {
  app.resize(window.innerWidth, window.innerHeight)
}

function tick (dt) {
  stats.begin()
  app.tick(dt)
  stats.end()
}
