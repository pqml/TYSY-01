import Events from 'core/Events'

const REGEX = /^[A-Z]$/

const defaultOpts = {
  monokey: false
}

let pressed = []
let released = []

function keyboard (opts) {
  opts = Object.assign({}, defaultOpts, opts)

  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)

  return {
    destroy
  }

  function onKeyDown (evt) {
    const key = evt.key.toUpperCase()
    if (!REGEX.test(key) || ~pressed.indexOf(key)) return

    // Force-release all pressed key
    if (opts.monokey) {
      pressed.forEach(pressedKey => {
        if (~released.indexOf(pressedKey)) return
        released.push(pressedKey)
        Events.dispatch('keyboard.off', pressedKey)
      })
    }

    // Emit kb on for the new pressed key
    pressed.push(key)
    Events.dispatch('keyboard.on', key)
  }

  function onKeyUp (evt) {
    const key = evt.key.toUpperCase()
    let pressedIndex = pressed.indexOf(key)
    let releasedIndex = released.indexOf(key)

    if (!REGEX.test(key) || !~pressedIndex) return
    pressed.splice(pressedIndex, 1)

    // don't emit keyboard.off if it's already force-released
    if (~released.indexOf(key)) return released.splice(releasedIndex, 1)

    // Else, emit keyboard.off
    Events.dispatch('keyboard.off', key)
  }

  function destroy () {
  }
}

export default keyboard
