import Events from 'core/Events'
import html from 'bel'

import './slider.styl'

const defaults = {
  name: '',
  onInput: function () {},
  syncWith: null,
  default: 0,
  units: 'ms',
  transform (v) { return v }
}

function slider (opts) {
  opts = Object.assign({}, defaults, opts)
  const $ = html`
    <div class="controller-slider">
      <div class="controller-label">
        <p>${opts.name}</p>
        <p class="slider-value"></p>
      </div>
      <div class="controller-input">
        <input type="range" class="slider" min="0" max="127">
      </div>
    </div>
  `

  const $value = $.querySelector('.slider-value')
  const $slider = $.querySelector('.slider')

  set(opts.default)

  $.addEventListener('input', (e) => {
    const val = parseInt(e.target.value)
    updateTextValue()
    opts.onInput(val)
  })

  if (opts.syncWith) {
    Events.on(opts.syncWith, (val) => {
      set(val)
    })
  }

  return $

  function set (val) {
    $slider.value = Math.min(Math.max(0, val), 127)
    updateTextValue()
  }

  function updateTextValue () {
    $value.textContent = opts.transform(parseInt($slider.value)) + opts.units
  }
}

export default slider
