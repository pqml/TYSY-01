import Letter from 'components/Letter'

function createLetterClass (opts) {
  return class DynamicallyCreatedLetter extends Letter {
    constructor () {
      super({
        id: opts.id,
        frequency: opts.freq,
        drawing: opts.drawing.default
      })
      this.name = opts.name
    }
  }
}

export default createLetterClass
