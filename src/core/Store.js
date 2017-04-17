import Events from 'core/Events'

const NS = '__STORE.'
let store = {}

const Store = {
  watch (k, cb) {
    Events.on(NS + k, cb)
  },
  watchOnce (k, cb) {
    Events.once(NS + k, cb)
  },
  unwatch (k, cb) {
    Events.off(NS + k, cb)
  },
  get (k) {
    return store[k]
  },
  set (k, val) {
    store[k] = val
    Events.dispatch(NS + k, val)
  }
}

export default Store
