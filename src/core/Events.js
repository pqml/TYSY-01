// Custom implementation of tiny-emitter
// https://github.com/scottcorgan/tiny-emitter

import toArray from 'lodash/toArray'

const actions = {}

const Actions = {
  on,
  once,
  off,
  dispatch
}

function on (name, cb) {
  (actions[name] || (actions[name] = [])).push(cb)
  return this
}

function once (name, cb) {
  function listener () {
    off(name, listener)
    cb.apply(null, arguments)
  }
  listener._ = cb
  return on(name, listener)
}

function off (name, cb) {
  const listeners = actions[name]
  const aliveListeners = []

  if (listeners && cb) {
    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i] !== cb && listeners[i]._ !== cb) {
        aliveListeners.push(listeners[i])
      }
    }
  }

  (aliveListeners.length)
    ? actions[name] = aliveListeners
    : delete actions[name]
}

function dispatch (name) {
  const data = toArray(arguments).slice(1)
  const cb = data.length > 1 ? data.pop() : null
  const listeners = (actions[name] || []).slice()

  if (cb) {
    let promises = []
    for (let i = 0; i < listeners.length; i++) {
      promises.push(listeners[i].apply(null, data))
    }
    Promise.all(promises).then(cb)
  } else {
    for (let i = 0; i < listeners.length; i++) {
      listeners[i].apply(null, data)
    }
  }
}

export default Actions
