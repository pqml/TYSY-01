import Letter from 'components/Letter'
import drawing from './D.drawing.js'

export default class D extends Letter {
  constructor () {
    super({
      frequency: 'F4',
      drawing: drawing
    })
  }
}
